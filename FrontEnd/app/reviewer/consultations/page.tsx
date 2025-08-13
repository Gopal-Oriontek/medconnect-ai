
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
  Calendar,
  Clock,
  User,
  Video,
  CheckCircle,
  AlertCircle,
  Eye,
  ArrowLeft,
  DollarSign
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

type ConsultationStats = {
  total: number
  completed: number
  upcoming: number
  totalEarnings: number
}

export default function ReviewerConsultationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [stats, setStats] = useState<ConsultationStats>({
    total: 0,
    completed: 0,
    upcoming: 0,
    totalEarnings: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

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
        const consultations = data.consultations || []
        setConsultations(consultations)

        // Calculate stats
        const stats = {
          total: consultations.length,
          completed: consultations.filter((c: Consultation) => c.status === 'COMPLETED').length,
          upcoming: consultations.filter((c: Consultation) => 
            ['SCHEDULED'].includes(c.status) && new Date(c.scheduledDate) >= new Date()
          ).length,
          totalEarnings: consultations
            .filter((c: Consultation) => c.status === 'COMPLETED')
            .reduce((sum: number, c: Consultation) => sum + (c.duration * 2.5), 0) // Approx $150/hour
        }
        setStats(stats)
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

  const filteredConsultations = consultations.filter(consultation => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'upcoming') {
      return ['SCHEDULED'].includes(consultation.status) && 
             new Date(consultation.scheduledDate) >= new Date()
    }
    return consultation.status.toLowerCase() === statusFilter
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
              My Consultations
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage all your consultation appointments
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
              <Link href="/reviewer/schedule">
                <Calendar className="mr-2 h-4 w-4" />
                View Schedule
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcoming}</div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">From consultations</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
          {[
            { id: 'all', label: 'All' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Consultations List */}
        <div className="space-y-4">
          {filteredConsultations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No consultations found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'all' 
                  ? 'You haven\'t had any consultations yet.'
                  : `No ${statusFilter} consultations found.`}
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
                          Order #{consultation.order.orderNumber} • Patient: {consultation.customer.name}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(consultation.status)}>
                        {consultation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {consultation.customer.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {consultation.customer.email}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {new Date(consultation.scheduledDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {new Date(consultation.scheduledDate).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          Duration: {consultation.duration} min
                        </div>
                        {consultation.status === 'COMPLETED' && (
                          <div className="text-sm text-green-600">
                            Earned: {formatCurrency(consultation.duration * 2.5)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {consultation.meetingLink && (
                          <div className="flex items-center space-x-2">
                            <Video className="h-4 w-4 text-gray-500" />
                            <span className="text-xs text-gray-500">Meeting ready</span>
                          </div>
                        )}
                        {consultation.reviewerNotes && (
                          <div className="text-xs text-gray-500">
                            Notes added
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {consultation.customerNotes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Patient notes:</strong> {consultation.customerNotes}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {consultation.status === 'SCHEDULED' && 
                       consultation.meetingLink && 
                       new Date(consultation.scheduledDate) <= new Date() && (
                        <Button size="sm" asChild>
                          <a href={consultation.meetingLink} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-1" />
                            Join Meeting
                          </a>
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/consultations/${consultation.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>

                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/orders/${consultation.order.id}`}>
                          View Order
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
    </div>
  )
}
