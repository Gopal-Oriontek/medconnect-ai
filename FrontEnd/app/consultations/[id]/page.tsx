
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  User,
  Video,
  FileText,
  Edit,
  ArrowLeft,
  Phone,
  Mail
} from 'lucide-react'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

type Consultation = {
  id: string
  scheduledDate: string
  duration: number
  status: string
  meetingLink?: string
  notes?: string
  customerNotes?: string
  reviewerNotes?: string
  customer: {
    id: string
    name: string
    email: string
  }
  reviewer: {
    id: string
    name: string
    specialization: string
    hourlyRate: number
  }
  order: {
    id: string
    orderNumber: string
    title: string
  }
}

export default function ConsultationDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchConsultation()
  }, [session, status, router, params.id])

  const fetchConsultation = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/consultations/${params.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setConsultation(data.consultation)
        setEditNotes(data.consultation.customerNotes || '')
      } else {
        toast({
          title: "Error",
          description: "Consultation not found.",
          variant: "destructive",
        })
        router.push('/consultations')
      }
    } catch (error) {
      console.error('Error fetching consultation:', error)
      toast({
        title: "Error",
        description: "Failed to load consultation details.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateNotes = async () => {
    if (!consultation) return

    try {
      const response = await fetch(`/api/consultations/${consultation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerNotes: editNotes
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setConsultation(data.consultation)
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Notes updated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update notes.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating notes:', error)
      toast({
        title: "Error",
        description: "Failed to update notes.",
        variant: "destructive",
      })
    }
  }

  const cancelConsultation = async () => {
    if (!consultation) return

    try {
      const response = await fetch(`/api/consultations/${consultation.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Consultation cancelled successfully.",
        })
        router.push('/consultations')
      } else {
        toast({
          title: "Error",
          description: "Failed to cancel consultation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error cancelling consultation:', error)
      toast({
        title: "Error",
        description: "Failed to cancel consultation.",
        variant: "destructive",
      })
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !consultation) {
    return null
  }

  const isCustomer = session.user.role === 'CUSTOMER'
  const canCancel = consultation.status === 'SCHEDULED' && 
                   new Date(consultation.scheduledDate) > new Date()
  const canJoin = consultation.status === 'SCHEDULED' && 
                  new Date(consultation.scheduledDate) <= new Date() &&
                  consultation.meetingLink

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" asChild>
            <Link href="/consultations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Consultations
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Consultation Details
            </h1>
            <p className="text-gray-600 mt-1">
              {consultation.order.title}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consultation Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{consultation.order.title}</CardTitle>
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
                  <div className="space-y-3">
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
                  <div className="space-y-3">
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
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {canJoin && (
                    <Button asChild>
                      <a href={consultation.meetingLink} target="_blank" rel="noopener noreferrer">
                        <Video className="mr-2 h-4 w-4" />
                        Join Meeting
                      </a>
                    </Button>
                  )}
                  
                  {consultation.status === 'SCHEDULED' && !canJoin && (
                    <Button disabled>
                      <Video className="mr-2 h-4 w-4" />
                      Meeting Starts {formatDateTime(consultation.scheduledDate)}
                    </Button>
                  )}
                  
                  {canCancel && (
                    <Button variant="destructive" onClick={cancelConsultation}>
                      Cancel Consultation
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Notes */}
            {isCustomer && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Your Notes</CardTitle>
                    {!isEditing && (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Add your notes, questions, or concerns..."
                        rows={4}
                      />
                      <div className="flex space-x-2">
                        <Button onClick={updateNotes}>Save Notes</Button>
                        <Button variant="outline" onClick={() => {
                          setIsEditing(false)
                          setEditNotes(consultation.customerNotes || '')
                        }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {consultation.customerNotes ? (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {consultation.customerNotes}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">
                          No notes added yet. Click Edit to add your questions or concerns.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reviewer Notes (visible after consultation) */}
            {consultation.reviewerNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reviewer Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {consultation.reviewerNotes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reviewer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reviewer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">Dr. {consultation.reviewer.name}</p>
                    <p className="text-sm text-blue-600">
                      {consultation.reviewer.specialization}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Rate: {formatCurrency(consultation.reviewer.hourlyRate)}/hour</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/orders/${consultation.order.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Order
                    </Link>
                  </Button>
                  
                  {consultation.status === 'COMPLETED' && (
                    <Button variant="outline" size="sm" className="w-full">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Follow-up
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Meeting Information */}
            {consultation.meetingLink && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Meeting Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      The meeting link will be active 15 minutes before the scheduled time.
                    </p>
                    {canJoin && (
                      <Button asChild className="w-full">
                        <a href={consultation.meetingLink} target="_blank" rel="noopener noreferrer">
                          <Video className="mr-2 h-4 w-4" />
                          Join Now
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
