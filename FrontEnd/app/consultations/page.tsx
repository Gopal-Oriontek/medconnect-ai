
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  User,
  Star,
  CheckCircle,
  AlertCircle,
  Plus,
  Video,
  FileText
} from 'lucide-react'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

type Reviewer = {
  id: string
  name: string
  specialization: string
  bio: string
  hourlyRate: number
  completedReviews: number
}

type AvailableSlot = {
  dateTime: string
  duration: number
  price: number
}

type Consultation = {
  id: string
  scheduledDate: string
  duration: number
  status: string
  customerNotes?: string
  reviewer: {
    id: string
    name: string
    specialization: string
  }
  order: {
    id: string
    orderNumber: string
    title: string
  }
}

type Order = {
  id: string
  orderNumber: string
  title: string
}

export default function ConsultationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [selectedOrder, setSelectedOrder] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'CUSTOMER') {
      router.push('/dashboard')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch consultations
      const consultationsResponse = await fetch('/api/consultations')
      if (consultationsResponse.ok) {
        const consultationsData = await consultationsResponse.json()
        setConsultations(consultationsData.consultations || [])
      }

      // Fetch reviewers
      const reviewersResponse = await fetch('/api/reviewers')
      if (reviewersResponse.ok) {
        const reviewersData = await reviewersResponse.json()
        setReviewers(reviewersData.reviewers || [])
      }

      // Fetch orders for booking
      const ordersResponse = await fetch('/api/orders')
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const eligibleOrders = (ordersData.orders || []).filter((order: any) => 
          ['ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(order.status)
        )
        setOrders(eligibleOrders)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load consultations data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReviewerSelect = async (reviewer: Reviewer) => {
    setSelectedReviewer(reviewer)
    try {
      const response = await fetch(`/api/consultations/available-slots?reviewerId=${reviewer.id}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots || [])
      }
    } catch (error) {
      console.error('Error fetching available slots:', error)
      toast({
        title: "Error",
        description: "Failed to load available slots.",
        variant: "destructive",
      })
    }
  }

  const handleBookConsultation = async () => {
    if (!selectedReviewer || !selectedSlot || !selectedOrder) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewerId: selectedReviewer.id,
          orderId: selectedOrder,
          scheduledDate: selectedSlot,
          customerNotes
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Consultation booked successfully!",
        })
        setIsBookingDialogOpen(false)
        setSelectedReviewer(null)
        setSelectedSlot('')
        setSelectedOrder('')
        setCustomerNotes('')
        setAvailableSlots([])
        fetchData()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to book consultation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error booking consultation:', error)
      toast({
        title: "Error",
        description: "Failed to book consultation.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredConsultations = consultations.filter(consultation => {
    if (activeTab === 'upcoming') {
      return ['SCHEDULED'].includes(consultation.status) && 
             new Date(consultation.scheduledDate) >= new Date()
    } else if (activeTab === 'completed') {
      return consultation.status === 'COMPLETED'
    } else {
      return consultation.status === 'CANCELLED'
    }
  })

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consultations</h1>
            <p className="text-gray-600 mt-1">
              Schedule and manage your medical consultations
            </p>
          </div>
          <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0">
                <Calendar className="mr-2 h-4 w-4" />
                Book Consultation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Book a Consultation</DialogTitle>
                <DialogDescription>
                  Select a reviewer, time slot, and provide details for your consultation.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reviewers List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select a Reviewer</h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {reviewers.map((reviewer) => (
                      <Card 
                        key={reviewer.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedReviewer?.id === reviewer.id ? 'bg-blue-50 border-blue-500' : ''
                        }`}
                        onClick={() => handleReviewerSelect(reviewer)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{reviewer.name}</CardTitle>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{reviewer.completedReviews}</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-blue-600 font-medium mb-1">
                            {reviewer.specialization}
                          </p>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {reviewer.bio}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">
                              {formatCurrency(reviewer.hourlyRate)}/hour
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Booking Form */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Booking Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Order</label>
                      <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an order" />
                        </SelectTrigger>
                        <SelectContent>
                          {orders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.title} (#{order.orderNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedReviewer && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Available Time Slots</label>
                        <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a time slot" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSlots.map((slot, index) => (
                              <SelectItem key={index} value={slot.dateTime}>
                                {formatDateTime(slot.dateTime)} - {slot.duration}min
                                ({formatCurrency(slot.price)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Additional Notes (Optional)
                      </label>
                      <Textarea
                        placeholder="Describe your specific concerns or questions..."
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button 
                      onClick={handleBookConsultation} 
                      disabled={!selectedReviewer || !selectedSlot || !selectedOrder || isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? 'Booking...' : 'Book Consultation'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
          {[
            { id: 'upcoming', label: 'Upcoming', icon: Calendar },
            { id: 'completed', label: 'Completed', icon: CheckCircle },
            { id: 'cancelled', label: 'Cancelled', icon: AlertCircle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Consultations List */}
        <div className="space-y-6">
          {filteredConsultations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No {activeTab} consultations
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'upcoming' 
                  ? 'Book your first consultation to get started.'
                  : `You don't have any ${activeTab} consultations yet.`}
              </p>
              {activeTab === 'upcoming' && (
                <div className="mt-6">
                  <Button onClick={() => setIsBookingDialogOpen(true)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Consultation
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredConsultations.map((consultation) => (
                <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {consultation.order.title}
                        </CardTitle>
                        <CardDescription>
                          Order #{consultation.order.orderNumber}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(consultation.status)}>
                        {consultation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            Dr. {consultation.reviewer.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {consultation.reviewer.specialization}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {formatDateTime(consultation.scheduledDate)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {consultation.duration} minutes
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {consultation.customerNotes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {consultation.customerNotes}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/consultations/${consultation.id}`}>
                          View Details
                        </Link>
                      </Button>
                      {consultation.status === 'SCHEDULED' && 
                       new Date(consultation.scheduledDate) > new Date() && (
                        <Button variant="ghost" size="sm">
                          <Video className="h-4 w-4 mr-1" />
                          Join Meeting
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
