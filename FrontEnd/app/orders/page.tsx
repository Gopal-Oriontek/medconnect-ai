

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import {
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Calendar,
  DollarSign,
  User,
  AlertCircle,
  Clock,
  CheckCircle
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
  payments: Array<{
    id: string
    amount: number
    status: string
    createdAt: string
  }>
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' }
]

const PRODUCT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'SECOND_OPINION', label: 'Second Opinion' },
  { value: 'CONSULTATION', label: 'Live Consultation' },
  { value: 'DOCUMENT_REVIEW', label: 'Document Review' },
  { value: 'EXPERT_ANALYSIS', label: 'Expert Analysis' }
]

export default function OrdersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    if (session) {
      fetchOrders()
    }
  }, [session, statusFilter])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const response = await fetch(`/api/orders?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data.orders || [])
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

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = !searchTerm || 
      order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.reviewer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || order.productType === typeFilter
    
    return matchesSearch && matchesType
  }) || []

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
                Please sign in to view your orders.
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-1">
              Track and manage your medical review orders
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders, numbers, or reviewers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-48"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredOrders?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {orders?.length === 0 ? 'No orders yet' : 'No matching orders'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {orders?.length === 0 
                    ? 'Get started by creating your first medical review order.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {orders?.length === 0 && (
                  <div className="mt-6">
                    <Button asChild>
                      <Link href="/orders/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Order
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredOrders?.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
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
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.paidAmount > 0 && `Paid: ${formatCurrency(order.paidAmount)}`}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {formatDateTime(order.createdAt)}</span>
                    </div>
                    
                    {order.reviewer ? (
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>Reviewer: {order.reviewer.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-orange-500">
                        <Clock className="h-4 w-4" />
                        <span>Awaiting assignment</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{order.documents?.length || 0} documents</span>
                    </div>

                    {order.completedAt ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Completed: {formatDateTime(order.completedAt)}</span>
                      </div>
                    ) : order.assignedAt ? (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Assigned: {formatDateTime(order.assignedAt)}</span>
                      </div>
                    ) : null}
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
                      {order.payments?.some(payment => payment.status === 'COMPLETED') && (
                        <Badge variant="secondary" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Payment Complete
                        </Badge>
                      )}
                    </div>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        {!isLoading && filteredOrders?.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Showing {filteredOrders.length} of {orders?.length || 0} orders
          </div>
        )}
      </div>
    </div>
  )
}
