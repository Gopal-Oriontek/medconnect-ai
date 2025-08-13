
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Get a specific consultation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const consultation = await prisma.consultation.findFirst({
      where: {
        id: params.id,
        OR: [
          { customerId: session.user.id },
          { reviewerId: session.user.id }
        ]
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            specialization: true,
            hourlyRate: true
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            title: true
          }
        }
      }
    })

    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
    }

    return NextResponse.json({ consultation })
  } catch (error) {
    console.error('Error fetching consultation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consultation' },
      { status: 500 }
    )
  }
}

// PUT - Update consultation (reschedule, add notes, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { scheduledDate, status, customerNotes, reviewerNotes, meetingLink } = body

    // Find the consultation
    const consultation = await prisma.consultation.findFirst({
      where: {
        id: params.id,
        OR: [
          { customerId: session.user.id },
          { reviewerId: session.user.id }
        ]
      }
    })

    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
    }

    // Prepare update data based on user role
    const updateData: any = {}
    
    if (scheduledDate) {
      updateData.scheduledDate = new Date(scheduledDate)
    }
    
    if (status) {
      updateData.status = status
    }

    if (session.user.role === 'CUSTOMER' && customerNotes !== undefined) {
      updateData.customerNotes = customerNotes
    }

    if (session.user.role === 'REVIEWER') {
      if (reviewerNotes !== undefined) {
        updateData.reviewerNotes = reviewerNotes
      }
      if (meetingLink !== undefined) {
        updateData.meetingLink = meetingLink
      }
    }

    const updatedConsultation = await prisma.consultation.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json({ consultation: updatedConsultation })
  } catch (error) {
    console.error('Error updating consultation:', error)
    return NextResponse.json(
      { error: 'Failed to update consultation' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel consultation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const consultation = await prisma.consultation.findFirst({
      where: {
        id: params.id,
        OR: [
          { customerId: session.user.id },
          { reviewerId: session.user.id }
        ]
      }
    })

    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
    }

    await prisma.consultation.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({ message: 'Consultation cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling consultation:', error)
    return NextResponse.json(
      { error: 'Failed to cancel consultation' },
      { status: 500 }
    )
  }
}
