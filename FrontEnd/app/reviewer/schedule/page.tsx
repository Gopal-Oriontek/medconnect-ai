
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  User,
  Video,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Eye,
  ArrowLeft
} from 'lucide-react'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

type Consultation = {
  id: string
  scheduledDate: string
  duration: number
  status: string
  meetingLink?: string
  customerNotes?: string
  reviewerNotes?: string
  customer: {
    id: string
    name: string
    email: string
  }
  order: {
    id: string
    orderNumber: string
    title: string
  }
}

export default function ReviewerSchedulePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)
  const [reviewerNotes, setReviewerNotes] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'REVIEWER') {
      router.push('/dashboard')
      return
    }

    fetchConsultations()
  }, [session, status, router])

  const fetchConsultations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/consultations')
      if (response.ok) {
        const data = await response.json()
        setConsultations(data.consultations || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load consultations.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching consultations:', error)
      toast({
        title: "Error",
        description: "Failed to load consultations.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openNotesDialog = (consultation: Consultation) => {
    setSelectedConsultation(consultation)
    setReviewerNotes(consultation.reviewerNotes || '')
    setMeetingLink(consultation.meetingLink || '')
    setIsNotesDialogOpen(true)
  }

  const updateConsultation = async () => {
    if (!selectedConsultation) return

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/consultations/${selectedConsultation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewerNotes,
          meetingLink
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Consultation updated successfully.",
        })
        setIsNotesDialogOpen(false)
        fetchConsultations()
      } else {
        toast({
          title: "Error",
          description: "Failed to update consultation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating consultation:', error)
      toast({
        title: "Error",
        description: "Failed to update consultation.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const markAsCompleted = async (consultationId: string) => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'COMPLETED'
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Consultation marked as completed.",
        })
        fetchConsultations()
      } else {
        toast({
          title: "Error",
          description: "Failed to update consultation status.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating consultation:', error)
      toast({
        title: "Error",
        description: "Failed to update consultation status.",
        variant: "destructive",
      })
    }
  }

  const filteredConsultations = consultations.filter(consultation => {
    if (activeTab === 'upcoming') {
      return ['SCHEDULED', 'IN_PROGRESS'].includes(consultation.status) && 
             new Date(consultation.scheduledDate) >= new Date()
    } else if (activeTab === 'today') {
      const today = new Date()
      const consultationDate = new Date(consultation.scheduledDate)
      return consultationDate.toDateString() === today.toDateString() &&
             ['SCHEDULED', 'IN_PROGRESS'].includes(consultation.status)
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
              My Schedule
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your consultation appointments
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button variant="outline" asChild>
              <Link href="/reviewer/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/reviewer/availability">
                <Calendar className="mr-2 h-4 w-4" />
                Manage Availability
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
          {[
            { id: 'today', label: 'Today', icon: Clock },
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
        <div className="space-y-4">
          {filteredConsultations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No {activeTab} consultations
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'today' 
                  ? 'You have no consultations scheduled for today.'
                  : `You don't have any ${activeTab} consultations yet.`}
              </p>
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
                          Order #{consultation.order.orderNumber} • {consultation.customer.name}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(consultation.status)}>
                        {consultation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {consultation.customer.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {formatDateTime(consultation.scheduledDate)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {consultation.duration} minutes
                          </span>
                        </div>
                        {consultation.meetingLink && (
                          <div className="flex items-center space-x-2">
                            <Video className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Meeting ready</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {consultation.customerNotes && (
                          <div className="text-sm text-gray-600">
                            <strong>Patient notes:</strong>
                            <p className="truncate">{consultation.customerNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {consultation.status === 'SCHEDULED' && 
                       new Date(consultation.scheduledDate) <= new Date() && (
                        <>
                          {consultation.meetingLink && (
                            <Button size="sm" asChild>
                              <a href={consultation.meetingLink} target="_blank" rel="noopener noreferrer">
                                <Video className="h-4 w-4 mr-1" />
                                Start Meeting
                              </a>
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => markAsCompleted(consultation.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Complete
                          </Button>
                        </>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openNotesDialog(consultation)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {consultation.reviewerNotes ? 'Edit Notes' : 'Add Notes'}
                      </Button>
                      
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/consultations/${consultation.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Consultation</DialogTitle>
            <DialogDescription>
              Add notes and meeting link for your consultation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Meeting Link
              </label>
              <Input
                placeholder="https://zoom.us/j/... or similar meeting URL"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Patients will use this link to join the consultation
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Reviewer Notes
              </label>
              <Textarea
                placeholder="Add your consultation notes, findings, recommendations..."
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                rows={6}
              />
            </div>

            {selectedConsultation?.customerNotes && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Patient Notes
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {selectedConsultation.customerNotes}
                  </p>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button onClick={updateConsultation} disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Consultation'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsNotesDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
