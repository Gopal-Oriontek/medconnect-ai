
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Get all reviewers for consultation booking
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const specialization = searchParams.get('specialization')

    const reviewers = await prisma.user.findMany({
      where: {
        role: 'REVIEWER',
        isActive: true,
        ...(specialization && { 
          specialization: { 
            contains: specialization, 
            mode: 'insensitive' 
          } 
        })
      },
      select: {
        id: true,
        name: true,
        specialization: true,
        bio: true,
        hourlyRate: true,
        licenseNumber: true,
        _count: {
          select: {
            reviewerOrders: {
              where: { status: 'COMPLETED' }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const reviewersWithStats = reviewers.map(reviewer => ({
      ...reviewer,
      completedReviews: reviewer._count.reviewerOrders
    }))

    return NextResponse.json({ reviewers: reviewersWithStats })
  } catch (error) {
    console.error('Error fetching reviewers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviewers' },
      { status: 500 }
    )
  }
}
