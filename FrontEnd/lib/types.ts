
import { UserRole, OrderStatus, ProductType, Priority, PaymentStatus, NotificationType } from '@prisma/client'

export type User = {
  id: string
  name?: string | null
  email: string
  role: UserRole
  phone?: string | null
  specialization?: string | null
  licenseNumber?: string | null
  bio?: string | null
  hourlyRate?: number | null
  availableSlots?: any
  isActive: boolean
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export type Order = {
  id: string
  orderNumber: string
  customerId: string
  reviewerId?: string | null
  productType: ProductType
  title: string
  description?: string | null
  status: OrderStatus
  priority: Priority
  totalAmount: number
  paidAmount: number
  dueDate?: Date | null
  assignedAt?: Date | null
  completedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  customer: User
  reviewer?: User | null
  documents: Document[]
  reviews: Review[]
  payments: Payment[]
}

export type Document = {
  id: string
  orderId: string
  fileName: string
  originalName: string
  fileSize: number
  fileType: string
  filePath: string
  uploadedBy: string
  isActive: boolean
  downloadCount: number
  createdAt: Date
  updatedAt: Date
}

export type Review = {
  id: string
  orderId: string
  reviewerId: string
  title: string
  content: string
  recommendations?: string | null
  severity: string
  isComplete: boolean
  reviewTime?: number | null
  createdAt: Date
  updatedAt: Date
  reviewer: User
}

export type Payment = {
  id: string
  orderId: string
  amount: number
  currency: string
  status: PaymentStatus
  paymentMethod?: string | null
  transactionId?: string | null
  processedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export type Notification = {
  id: string
  userId: string
  orderId?: string | null
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  isEmailSent: boolean
  metadata?: any
  createdAt: Date
}

export type CartItem = {
  productType: ProductType
  title: string
  description: string
  price: number
  documents?: File[]
}

// Next-auth types extension
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email: string
      role: string
      image?: string | null
    }
  }

  interface User {
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
  }
}
