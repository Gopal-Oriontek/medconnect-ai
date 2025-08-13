
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch consultations for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = session.user.role

    let consultations: any[] = []

    if (role === 'CUSTOMER') {
      consultations = await prisma.consultation.findMany({
        where: {
          customerId: session.user.id,
          ...(status && { status: status as any })
        },
        include: {
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
        },
        orderBy: { scheduledDate: 'asc' }
      })
    } else if (role === 'REVIEWER') {
      consultations = await prisma.consultation.findMany({
        where: {
          reviewerId: session.user.id,
          ...(status && { status: status as any })
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              title: true
            }
          }
        },
        orderBy: { scheduledDate: 'asc' }
      })
    }

    return NextResponse.json({ consultations })
  } catch (error) {
    console.error('Error fetching consultations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consultations' },
      { status: 500 }
    )
  }
}

// POST - Create a new consultation booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, reviewerId, scheduledDate, duration, customerNotes } = body

    // Verify the order exists and belongs to the customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: session.user.id
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if the time slot is available
    const existingConsultation = await prisma.consultation.findFirst({
      where: {
        reviewerId,
        scheduledDate: new Date(scheduledDate),
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
      }
    })

    if (existingConsultation) {
      return NextResponse.json({ error: 'Time slot not available' }, { status: 409 })
    }

    // Create the consultation
    const consultation = await prisma.consultation.create({
      data: {
        orderId,
        customerId: session.user.id,
        reviewerId,
        scheduledDate: new Date(scheduledDate),
        duration: duration || 60,
        customerNotes,
        status: 'SCHEDULED'
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true
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

    // Create notification for reviewer
    await prisma.notification.create({
      data: {
        userId: reviewerId,
        orderId,
        title: 'New Consultation Scheduled',
        message: `A consultation has been scheduled with ${session.user.name} for ${new Date(scheduledDate).toLocaleDateString()}`,
        type: 'CONSULTATION_SCHEDULED'
      }
    })

    return NextResponse.json({ consultation }, { status: 201 })
  } catch (error) {
    console.error('Error creating consultation:', error)
    return NextResponse.json(
      { error: 'Failed to create consultation' },
      { status: 500 }
    )
  }
}
