
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateOrderNumber } from '@/lib/utils'
import { ProductType, Priority, OrderStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = session.user.role

    let whereClause: any = {}

    // Filter by user role
    if (role === 'CUSTOMER') {
      whereClause.customerId = session.user.id
    } else if (role === 'REVIEWER') {
      whereClause.OR = [
        { reviewerId: session.user.id },
        { reviewerId: null, status: OrderStatus.PENDING_REVIEW }
      ]
    }
    // Admin can see all orders

    // Filter by status if provided
    if (status && status !== 'all') {
      whereClause.status = status
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
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
            specialization: true
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
            createdAt: true
          }
        },
        reviews: {
          select: {
            id: true,
            title: true,
            isComplete: true,
            createdAt: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      productType,
      title,
      description,
      priority = 'MEDIUM',
      totalAmount
    } = body

    if (!productType || !title || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate product type
    if (!Object.values(ProductType).includes(productType)) {
      return NextResponse.json(
        { error: 'Invalid product type' },
        { status: 400 }
      )
    }

    // Validate priority
    if (!Object.values(Priority).includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      )
    }

    // Generate unique order number
    const orderNumber = generateOrderNumber()

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: session.user.id,
        productType,
        title,
        description: description || null,
        priority,
        totalAmount: parseFloat(totalAmount),
        status: OrderStatus.PENDING_REVIEW
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create notification for admins and available reviewers
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true }
    })

    const reviewers = await prisma.user.findMany({
      where: { role: 'REVIEWER', isActive: true },
      select: { id: true }
    })

    const notificationUsers = [...adminUsers, ...reviewers]

    if (notificationUsers.length > 0) {
      await prisma.notification.createMany({
        data: notificationUsers.map(user => ({
          userId: user.id,
          orderId: order.id,
          title: 'New Order Created',
          message: `A new ${productType.toLowerCase().replace('_', ' ')} order has been created by ${order.customer.name}`,
          type: 'ORDER_CREATED'
        }))
      })
    }

    return NextResponse.json({
      message: 'Order created successfully',
      order
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
