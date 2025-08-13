
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  FileText,
  Download,
  Calendar,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  Eye,
  MessageSquare,
  Star,
} from 'lucide-react'
import { 
  formatCurrency, 
  formatDateTime, 
  getStatusColor, 
  getPriorityColor,
  formatFileSize,
  getFileIcon
} from '@/lib/utils'

type OrderDetails = {
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
    licenseNumber?: string
    hourlyRate?: number
  }
  documents: Array<{
    id: string
    fileName: string
    originalName: string
    fileSize: number
    fileType: string
    filePath: string
    downloadCount: number
    createdAt: string
    uploader: {
      id: string
      name: string
      role: string
    }
  }>
  reviews: Array<{
    id: string
    title: string
    content: string
    recommendations?: string
    severity: string
    isComplete: boolean
    reviewTime?: number
    createdAt: string
    reviewer: {
      id: string
      name: string
      specialization?: string
    }
  }>
  payments: Array<{
    id: string
    amount: number
    currency: string
    status: string
    paymentMethod?: string
    transactionId?: string
    processedAt?: string
    createdAt: string
  }>
  consultations: Array<{
    id: string
    scheduledDate: string
    duration: number
    status: string
    meetingLink?: string
    notes?: string
    createdAt: string
  }>
}

export default function OrderDetailsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session && params.id) {
      fetchOrderDetails()
    }
  }, [session, params.id])

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/orders/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Order Not Found',
            description: 'The requested order could not be found.',
            variant: 'destructive'
          })
          router.push('/orders')
          return
        }
        throw new Error('Failed to fetch order details')
      }

      const data = await response.json()
      setOrder(data.order)
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load order details. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const downloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (!response.ok) {
        throw new Error('Failed to download document')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download Failed',
        description: 'Unable to download the document. Please try again.',
        variant: 'destructive'
      })
    }
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
              <p className="mt-1 text-sm text-gray-500">Please sign in to view order details.</p>
              <Button className="mt-4" onClick={() => router.push('/auth/signin')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-96 mb-6"></div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-medium">Order Not Found</h3>
              <p className="mt-1 text-sm text-gray-500">
                The requested order could not be found or you don't have access to it.
              </p>
              <Button className="mt-4" onClick={() => router.back()}>
                Go Back
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
            <h1 className="text-3xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-600 mt-1">{order.title}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <Badge className={getStatusColor(order.status)}>
              {order.status.replace('_', ' ')}
            </Badge>
            <Badge className={getPriorityColor(order.priority)}>
              {order.priority}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Order Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Service Type</label>
                    <p className="text-sm font-semibold">{order.productType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <p className="text-sm font-semibold">{order.priority}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-sm">{formatDateTime(order.createdAt)}</p>
                  </div>
                  {order.assignedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned</label>
                      <p className="text-sm">{formatDateTime(order.assignedAt)}</p>
                    </div>
                  )}
                  {order.completedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Completed</label>
                      <p className="text-sm">{formatDateTime(order.completedAt)}</p>
                    </div>
                  )}
                </div>

                {order.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{order.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Documents ({order.documents.length})</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No documents have been uploaded for this order yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {order.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getFileIcon(doc.fileType)}</span>
                          <div>
                            <p className="text-sm font-medium">{doc.originalName}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.fileSize)} • Uploaded {formatDateTime(doc.createdAt)} by {doc.uploader.name}
                            </p>
                            {doc.downloadCount > 0 && (
                              <p className="text-xs text-gray-400">
                                Downloaded {doc.downloadCount} time{doc.downloadCount !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadDocument(doc.id, doc.originalName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            {order.reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Medical Review</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.reviews.map((review) => (
                    <div key={review.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{review.title}</h4>
                          <p className="text-sm text-gray-500">
                            By {review.reviewer.name} {review.reviewer.specialization && `(${review.reviewer.specialization})`}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{formatDateTime(review.createdAt)}</p>
                          {review.reviewTime && <p>{review.reviewTime} minutes</p>}
                        </div>
                      </div>
                      
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-sm p-4 bg-gray-50 rounded-lg">
                          {review.content}
                        </div>
                      </div>

                      {review.recommendations && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h5>
                          <div className="text-sm p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                            {review.recommendations}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer/Reviewer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>
                    {session.user.role === 'CUSTOMER' ? 'Assigned Reviewer' : 'Customer'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {session.user.role === 'CUSTOMER' ? (
                  order.reviewer ? (
                    <div className="space-y-2">
                      <p className="font-medium">{order.reviewer.name}</p>
                      {order.reviewer.specialization && (
                        <p className="text-sm text-gray-600">{order.reviewer.specialization}</p>
                      )}
                      <p className="text-sm text-gray-500">{order.reviewer.email}</p>
                      {order.reviewer.licenseNumber && (
                        <p className="text-xs text-gray-400">
                          License: {order.reviewer.licenseNumber}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">
                        Waiting for reviewer assignment
                      </p>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-sm text-gray-500">{order.customer.email}</p>
                    {order.customer.phone && (
                      <p className="text-sm text-gray-500">{order.customer.phone}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount</span>
                  <span className="text-sm font-medium">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Paid Amount</span>
                  <span className="text-sm font-medium">{formatCurrency(order.paidAmount)}</span>
                </div>
                {order.payments.length > 0 && (
                  <div className="pt-2 border-t">
                    <h6 className="text-sm font-medium text-gray-700 mb-2">Payment History</h6>
                    {order.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">
                          {payment.paymentMethod?.toUpperCase()} • {formatDateTime(payment.createdAt)}
                        </span>
                        <Badge
                          variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {session.user.role === 'CUSTOMER' && (
                  <>
                    <Button size="sm" className="w-full" variant="outline" asChild>
                      <a href={`mailto:support@medreview.com?subject=Order ${order.orderNumber}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact Support
                      </a>
                    </Button>
                    {order.status === 'COMPLETED' && (
                      <Button size="sm" className="w-full" variant="outline">
                        <Star className="h-4 w-4 mr-2" />
                        Rate Review
                      </Button>
                    )}
                  </>
                )}
                
                {session.user.role === 'REVIEWER' && order.reviewer?.id === session.user.id && (
                  <Button size="sm" className="w-full" asChild>
                    <a href={`/reviewer/orders/${order.id}/review`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Continue Review
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
