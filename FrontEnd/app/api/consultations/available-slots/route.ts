
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Get available consultation slots for reviewers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reviewerId = searchParams.get('reviewerId')
    const date = searchParams.get('date')

    if (!reviewerId) {
      return NextResponse.json({ error: 'Reviewer ID required' }, { status: 400 })
    }

    // Get reviewer info
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId, role: 'REVIEWER' },
      select: {
        id: true,
        name: true,
        specialization: true,
        hourlyRate: true,
        availableSlots: true
      }
    })

    if (!reviewer) {
      return NextResponse.json({ error: 'Reviewer not found' }, { status: 404 })
    }

    // Get existing consultations for the reviewer
    const startDate = date ? new Date(date) : new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7) // Next 7 days

    const existingConsultations = await prisma.consultation.findMany({
      where: {
        reviewerId,
        scheduledDate: {
          gte: startDate,
          lte: endDate
        },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
      },
      select: {
        scheduledDate: true,
        duration: true
      }
    })

    // Generate available slots (simplified version - in real app, use reviewer's availableSlots)
    const availableSlots = []
    const workingHours = [9, 10, 11, 14, 15, 16, 17] // 9 AM to 6 PM with lunch break

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(currentDate.getDate() + i)
      
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        continue
      }

      for (const hour of workingHours) {
        const slotTime = new Date(currentDate)
        slotTime.setHours(hour, 0, 0, 0)

        // Skip past times
        if (slotTime < new Date()) {
          continue
        }

        // Check if slot is not booked
        const isBooked = existingConsultations.some(consultation => {
          const consultationStart = new Date(consultation.scheduledDate)
          const consultationEnd = new Date(consultationStart.getTime() + consultation.duration * 60000)
          const slotEnd = new Date(slotTime.getTime() + 60 * 60000) // 1 hour duration

          return (slotTime < consultationEnd && slotEnd > consultationStart)
        })

        if (!isBooked) {
          availableSlots.push({
            dateTime: slotTime.toISOString(),
            duration: 60,
            price: reviewer.hourlyRate || 150
          })
        }
      }
    }

    return NextResponse.json({ 
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        specialization: reviewer.specialization,
        hourlyRate: reviewer.hourlyRate
      },
      availableSlots 
    })
  } catch (error) {
    console.error('Error fetching available slots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    )
  }
}
