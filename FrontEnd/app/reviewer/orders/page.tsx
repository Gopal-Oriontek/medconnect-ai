

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import {
  FileText,
  Search,
  Eye,
  Calendar,
  DollarSign,
  User,
  AlertCircle,
  Clock,
  CheckCircle,
  Award,
  TrendingUp,
  PlayCircle,
  PauseCircle
} from 'lucide-react'
import { 
  formatCurrency, 
  formatDateTime, 
  getStatusColor, 
  getPriorityColor 
} from '@/lib/utils'

type Order = {
  id: string
  orderNumber: string
  title: string
  description?: string
  status: string
  priority: string
  productType: string
  totalAmount: number
  paidAmount: number
  createdAt: string
  assignedAt?: string
  completedAt?: string
  customer: {
    id: string
    name: string
    email: string
    phone?: string
  }
  reviewer?: {
    id: string
    name: string
    email: string
    specialization?: string
  }
  documents: Array<{
    id: string
    fileName: string
    originalName: string
    fileType: string
  }>
  reviews: Array<{
    id: string
    title: string
    isComplete: boolean
    createdAt: string
  }>
}

type ReviewerStats = {
  totalOrders: number
  activeOrders: number
  completedOrders: number
  totalEarnings: number
  averageRating: number
  completionRate: number
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: 'available', label: 'Available Orders' },
  { value: 'assigned', label: 'My Assigned Orders' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'COMPLETED', label: 'Completed' }
]

export default function ReviewerOrdersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<ReviewerStats>({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    averageRating: 4.5,
    completionRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('available')

  useEffect(() => {
    if (session?.user?.role === 'REVIEWER') {
      fetchOrders()
    } else if (session?.user && session.user.role !== 'REVIEWER') {
      router.push('/dashboard')
    }
  }, [session, statusFilter])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'available') {
          params.set('status', 'PENDING_REVIEW')
        } else if (statusFilter === 'assigned') {
          // Will be filtered client-side for assigned orders
        } else {
          params.set('status', statusFilter)
        }
      }

      const response = await fetch(`/api/orders?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      const allOrders = data.orders || []
      setOrders(allOrders)

      // Calculate stats
      const myOrders = allOrders.filter((order: Order) => order.reviewer?.id === session?.user?.id)
      const completedOrders = myOrders.filter((order: Order) => order.status === 'COMPLETED')
      const activeOrders = myOrders.filter((order: Order) => 
        ['ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(order.status)
      )

      setStats({
        totalOrders: myOrders.length,
        activeOrders: activeOrders.length,
        completedOrders: completedOrders.length,
        totalEarnings: completedOrders.reduce((sum: number, order: Order) => sum + (order.totalAmount * 0.7), 0), // 70% commission
        averageRating: 4.5, // This would come from reviews/ratings
        completionRate: myOrders.length > 0 ? (completedOrders.length / myOrders.length) * 100 : 0
      })
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast({
        title: 'Error',
        description: 'Failed to load orders. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const assignOrderToMe = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewerId: session?.user?.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to assign order')
      }

      toast({
        title: 'Order Assigned',
        description: 'The order has been assigned to you successfully.'
      })

      // Refresh orders
      fetchOrders()
    } catch (error) {
      console.error('Error assigning order:', error)
      toast({
        title: 'Assignment Failed',
        description: 'Unable to assign the order. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const getFilteredOrders = () => {
    if (!orders) return []
    
    let filtered = orders

    if (activeTab === 'available') {
      filtered = orders.filter(order => 
        order.status === 'PENDING_REVIEW' && !order.reviewer
      )
    } else if (activeTab === 'assigned') {
      filtered = orders.filter(order => 
        order.reviewer?.id === session?.user?.id
      )
    }

    return filtered.filter(order => {
      const matchesSearch = !searchTerm || 
        order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-medium">Authentication Required</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please sign in to view orders.
              </p>
              <Button className="mt-4" onClick={() => router.push('/auth/signin')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (session.user.role !== 'REVIEWER') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-orange-500" />
              <h3 className="mt-2 text-lg font-medium">Access Restricted</h3>
              <p className="mt-1 text-sm text-gray-500">
                This page is only accessible to reviewers.
              </p>
              <Button className="mt-4" onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const filteredOrders = getFilteredOrders()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">
            Review available orders and manage your assignments
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <PlayCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeOrders}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
              <p className="text-xs text-muted-foreground">Finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">Total earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Award className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Available Orders</TabsTrigger>
            <TabsTrigger value="assigned">My Assigned Orders</TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <Card className="mt-4">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search orders, numbers, or customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="available" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Orders</CardTitle>
                <CardDescription>
                  Orders waiting for reviewer assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse border rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-2">
                            <div className="h-5 bg-gray-200 rounded w-48"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                      No available orders
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      There are no orders waiting for assignment at the moment.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{order.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Order #{order.orderNumber}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(order.priority)}>
                                {order.priority}
                              </Badge>
                              <Badge variant="outline">
                                {order.productType.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(order.totalAmount * 0.7)} {/* 70% commission */}
                            </p>
                            <p className="text-xs text-gray-500">Your earning</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>Customer: {order.customer.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Created: {formatDateTime(order.createdAt)}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <FileText className="h-4 w-4" />
                            <span>{order.documents?.length || 0} documents</span>
                          </div>
                        </div>

                        {order.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {order.description}
                          </p>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            Total Order Value: {formatCurrency(order.totalAmount)}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/orders/${order.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => assignOrderToMe(order.id)}
                            >
                              Accept Order
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assigned" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Assigned Orders</CardTitle>
                <CardDescription>
                  Orders currently assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse border rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-2">
                            <div className="h-5 bg-gray-200 rounded w-48"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <PauseCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                      No assigned orders
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You don't have any orders assigned to you yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{order.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Order #{order.orderNumber}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(order.priority)}>
                                {order.priority}
                              </Badge>
                              <Badge variant="outline">
                                {order.productType.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(order.totalAmount * 0.7)} {/* 70% commission */}
                            </p>
                            <p className="text-xs text-gray-500">Your earning</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>Customer: {order.customer.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Created: {formatDateTime(order.createdAt)}</span>
                          </div>

                          {order.assignedAt && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>Assigned: {formatDateTime(order.assignedAt)}</span>
                            </div>
                          )}

                          <div className="flex items-center space-x-1">
                            <FileText className="h-4 w-4" />
                            <span>{order.documents?.length || 0} documents</span>
                          </div>
                        </div>

                        {order.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {order.description}
                          </p>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="flex space-x-2">
                            {order.reviews?.some(review => review.isComplete) && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Review Complete
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/orders/${order.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </Button>
                            {order.status === 'ASSIGNED' && (
                              <Button size="sm" asChild>
                                <Link href={`/reviewer/orders/${order.id}/review`}>
                                  Start Review
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
