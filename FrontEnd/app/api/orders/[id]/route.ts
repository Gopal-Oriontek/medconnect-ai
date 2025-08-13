
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderId = params.id

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true,
            licenseNumber: true,
            hourlyRate: true
          }
        },
        documents: {
          where: { isActive: true },
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileSize: true,
            fileType: true,
            filePath: true,
            downloadCount: true,
            createdAt: true,
            uploader: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        },
        reviews: {
          select: {
            id: true,
            title: true,
            content: true,
            recommendations: true,
            severity: true,
            isComplete: true,
            reviewTime: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                name: true,
                specialization: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            paymentMethod: true,
            transactionId: true,
            processedAt: true,
            createdAt: true
          }
        },
        consultations: {
          select: {
            id: true,
            scheduledDate: true,
            duration: true,
            status: true,
            meetingLink: true,
            notes: true,
            createdAt: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check access permissions
    const isCustomer = session.user.role === 'CUSTOMER' && order.customerId === session.user.id
    const isReviewer = session.user.role === 'REVIEWER' && order.reviewerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isCustomer && !isReviewer && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderId = params.id
    const body = await request.json()
    const { status, reviewerNotes } = body

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check permissions
    const isReviewer = session.user.role === 'REVIEWER' && order.reviewerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isReviewer && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update order
    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Create notification if status changed
    if (status) {
      await prisma.notification.create({
        data: {
          userId: updatedOrder.customerId,
          orderId: updatedOrder.id,
          title: 'Order Status Updated',
          message: `Your order ${updatedOrder.orderNumber} status has been updated to ${status.replace('_', ' ').toLowerCase()}`,
          type: 'ORDER_UPDATED'
        }
      })
    }

    return NextResponse.json({
      message: 'Order updated successfully',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
