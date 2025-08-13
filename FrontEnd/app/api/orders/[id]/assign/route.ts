

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NotificationType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only reviewers and admins can assign orders
    if (session.user.role !== 'REVIEWER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const orderId = params.id
    const body = await request.json()
    const { reviewerId } = body

    // If no reviewerId provided, use current user (for self-assignment by reviewers)
    const targetReviewerId = reviewerId || session.user.id

    // Verify the target reviewer exists and is active
    const reviewer = await prisma.user.findUnique({
      where: { 
        id: targetReviewerId,
        role: 'REVIEWER',
        isActive: true 
      }
    })

    if (!reviewer) {
      return NextResponse.json(
        { error: 'Reviewer not found or inactive' },
        { status: 400 }
      )
    }

    // Get the order and verify it's available for assignment
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Order is not available for assignment' },
        { status: 400 }
      )
    }

    if (order.reviewerId) {
      return NextResponse.json(
        { error: 'Order is already assigned' },
        { status: 400 }
      )
    }

    // Assign the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        reviewerId: targetReviewerId,
        status: 'ASSIGNED',
        assignedAt: new Date()
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        },
        reviewer: {
          select: { id: true, name: true, email: true, specialization: true }
        }
      }
    })

    // Create notifications
    const notifications = []

    // Notify customer
    notifications.push({
      userId: order.customerId,
      orderId: order.id,
      title: 'Order Assigned to Reviewer',
      message: `Your order ${order.orderNumber} has been assigned to ${reviewer.name}${reviewer.specialization ? ` (${reviewer.specialization})` : ''}`,
      type: NotificationType.ORDER_ASSIGNED
    })

    // Notify reviewer (if not self-assigning)
    if (targetReviewerId !== session.user.id) {
      notifications.push({
        userId: targetReviewerId,
        orderId: order.id,
        title: 'New Order Assigned',
        message: `You have been assigned order ${order.orderNumber} from ${order.customer.name}`,
        type: NotificationType.ORDER_ASSIGNED
      })
    }

    // Notify admins
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true }
    })

    adminUsers.forEach(admin => {
      notifications.push({
        userId: admin.id,
        orderId: order.id,
        title: 'Order Assignment Update',
        message: `Order ${order.orderNumber} has been assigned to ${reviewer.name}`,
        type: NotificationType.ORDER_ASSIGNED
      })
    })

    // Create all notifications
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      })
    }

    return NextResponse.json({
      message: 'Order assigned successfully',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Order assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
