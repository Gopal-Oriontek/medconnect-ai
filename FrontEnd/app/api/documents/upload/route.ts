
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.formData()
    const file = data.get('file') as File
    const orderId = data.get('orderId') as string

    if (!file || !orderId) {
      return NextResponse.json(
        { error: 'File and order ID are required' },
        { status: 400 }
      )
    }

    // Verify order belongs to user or user is reviewer/admin
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (
      session.user.role === 'CUSTOMER' && 
      order.customerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return NextResponse.json(
        { error: 'File size too large (max 50MB)' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || ''
    const uniqueFilename = `${uuidv4()}.${fileExtension}`
    
    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'uploads', orderId)
    await mkdir(uploadDir, { recursive: true })
    
    const filePath = join(uploadDir, uniqueFilename)
    
    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        orderId,
        fileName: uniqueFilename,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: `/uploads/${orderId}/${uniqueFilename}`,
        uploadedBy: session.user.id
      }
    })

    // Create notification for assigned reviewer if exists
    if (order.reviewerId) {
      await prisma.notification.create({
        data: {
          userId: order.reviewerId,
          orderId: order.id,
          title: 'New Document Uploaded',
          message: `A new document "${file.name}" has been uploaded to order ${order.orderNumber}`,
          type: 'DOCUMENT_UPLOADED'
        }
      })
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      document: {
        id: document.id,
        fileName: document.fileName,
        originalName: document.originalName,
        fileSize: document.fileSize,
        fileType: document.fileType
      }
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
