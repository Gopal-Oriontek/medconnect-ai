
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  DollarSign,
  Calendar,
  Users,
  Eye,
} from 'lucide-react'
import { formatCurrency, formatDateTime, getStatusColor, getPriorityColor } from '@/lib/utils'

type Order = {
  id: string
  orderNumber: string
  title: string
  status: string
  priority: string
  totalAmount: number
  createdAt: string
  customer: {
    name: string
    email: string
  }
  documents: Array<{
    id: string
    fileName: string
  }>
}

type ReviewerStats = {
  pendingOrders: number
  activeOrders: number
  completedReviews: number
  totalEarnings: number
}

export default function ReviewerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<ReviewerStats>({
    pendingOrders: 0,
    activeOrders: 0,
    completedReviews: 0,
    totalEarnings: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Redirect non-reviewers
    if (session.user.role !== 'REVIEWER') {
      if (session.user.role === 'CUSTOMER') {
        router.push('/dashboard')
      } else if (session.user.role === 'ADMIN') {
        router.push('/admin/dashboard')
      }
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch reviewer orders
      const ordersResponse = await fetch('/api/orders?limit=10')
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const orders = ordersData.orders || []
        setOrders(orders)

        // Calculate stats
        const stats = {
          pendingOrders: orders.filter((o: Order) => o.status === 'PENDING_REVIEW').length,
          activeOrders: orders.filter((o: Order) => 
            ['ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(o.status)
          ).length,
          completedReviews: orders.filter((o: Order) => o.status === 'COMPLETED').length,
          totalEarnings: orders
            .filter((o: Order) => o.status === 'COMPLETED')
            .reduce((sum: number, o: Order) => sum + (o.totalAmount * 0.7), 0) // 70% commission
        }
        setStats(stats)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const acceptOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/assign`, {
        method: 'POST'
      })

      if (response.ok) {
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Error accepting order:', error)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'REVIEWER') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reviewer Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, Dr. {session.user.name}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button variant="outline" asChild>
              <Link href="/reviewer/schedule">View Schedule</Link>
            </Button>
            <Button asChild>
              <Link href="/reviewer/orders">View All Orders</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">Available to accept</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
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
              <div className="text-2xl font-bold">{stats.completedReviews}</div>
              <p className="text-xs text-muted-foreground">Reviews finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">Total earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Available Orders */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span>Available Orders</span>
              </CardTitle>
              <CardDescription>
                Orders waiting for reviewer assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.filter(order => order.status === 'PENDING_REVIEW').length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending orders</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Check back later for new review requests.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders
                    .filter(order => order.status === 'PENDING_REVIEW')
                    .slice(0, 3)
                    .map((order) => (
                    <div
                      key={order.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">{order.title}</h4>
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Order #{order.orderNumber}</p>
                        <p>Patient: {order.customer.name}</p>
                        <p>Documents: {order.documents.length}</p>
                        <p>Value: {formatCurrency(order.totalAmount)}</p>
                        <p>Created: {formatDateTime(order.createdAt)}</p>
                      </div>
                      
                      <div className="mt-3 flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => acceptOrder(order.id)}
                        >
                          Accept Order
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/reviewer/orders/${order.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>My Active Orders</span>
              </CardTitle>
              <CardDescription>
                Orders currently assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.filter(order => 
                ['ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(order.status)
              ).length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No active orders</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Accept orders to start reviewing.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders
                    .filter(order => ['ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(order.status))
                    .slice(0, 3)
                    .map((order) => (
                    <div
                      key={order.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">{order.title}</h4>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Order #{order.orderNumber}</p>
                        <p>Patient: {order.customer.name}</p>
                        <p>Documents: {order.documents.length}</p>
                        <p>Created: {formatDateTime(order.createdAt)}</p>
                      </div>
                      
                      <div className="mt-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/reviewer/orders/${order.id}`}>
                            Continue Review
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Link href="/reviewer/orders">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>All Orders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  View and manage all your assigned orders and reviews
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reviewer/schedule">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span>Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage your availability and consultation appointments
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reviewer/earnings">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <span>Earnings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track your earnings and payment history
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
