

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'

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

    const documentId = params.id

    // Fetch document with order information
    const document = await prisma.document.findUnique({
      where: { 
        id: documentId,
        isActive: true 
      },
      include: {
        order: {
          select: {
            id: true,
            customerId: true,
            reviewerId: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check access permissions
    const isCustomer = session.user.role === 'CUSTOMER' && document.order.customerId === session.user.id
    const isReviewer = session.user.role === 'REVIEWER' && document.order.reviewerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isCustomer && !isReviewer && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Construct file path
    const filePath = join(process.cwd(), 'uploads', document.order.id, document.fileName)
    
    try {
      // Read the file
      const fileBuffer = await readFile(filePath)
      
      // Update download count
      await prisma.document.update({
        where: { id: documentId },
        data: { 
          downloadCount: { increment: 1 } 
        }
      })

      // Set appropriate headers
      const headers = new Headers()
      headers.set('Content-Type', document.fileType)
      headers.set('Content-Disposition', `attachment; filename="${document.originalName}"`)
      headers.set('Content-Length', document.fileSize.toString())
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      })
    } catch (fileError) {
      console.error('File read error:', fileError)
      return NextResponse.json(
        { error: 'File not found on server' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Document download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
