
import { PrismaClient, UserRole, OrderStatus, ProductType, Priority, PaymentStatus, NotificationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash passwords
  const hashedTestPassword = await bcrypt.hash('johndoe123', 10)
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create test users
  console.log('👥 Creating users...')
  
  // Mandatory test account
  const testAdmin = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedTestPassword,
      name: 'John Doe',
      role: UserRole.ADMIN,
      phone: '+1-555-0123',
      isActive: true,
    }
  })

  // Sample customers
  const customer1 = await prisma.user.upsert({
    where: { email: 'sarah.patient@email.com' },
    update: {},
    create: {
      email: 'sarah.patient@email.com',
      password: hashedPassword,
      name: 'Sarah Johnson',
      role: UserRole.CUSTOMER,
      phone: '+1-555-0124',
      isActive: true,
    }
  })

  const customer2 = await prisma.user.upsert({
    where: { email: 'mike.patient@email.com' },
    update: {},
    create: {
      email: 'mike.patient@email.com',
      password: hashedPassword,
      name: 'Michael Chen',
      role: UserRole.CUSTOMER,
      phone: '+1-555-0125',
      isActive: true,
    }
  })

  // Sample reviewers
  const reviewer1 = await prisma.user.upsert({
    where: { email: 'dr.smith@medreview.com' },
    update: {},
    create: {
      email: 'dr.smith@medreview.com',
      password: hashedPassword,
      name: 'Dr. Emily Smith',
      role: UserRole.REVIEWER,
      phone: '+1-555-0126',
      specialization: 'Cardiology',
      licenseNumber: 'MD-12345-CA',
      bio: 'Board-certified cardiologist with 15+ years of experience in cardiovascular medicine and interventional cardiology.',
      hourlyRate: 250.0,
      availableSlots: {
        monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        wednesday: ['09:00', '10:00', '11:00'],
        thursday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        friday: ['09:00', '10:00', '11:00']
      },
      isActive: true,
    }
  })

  const reviewer2 = await prisma.user.upsert({
    where: { email: 'dr.wilson@medreview.com' },
    update: {},
    create: {
      email: 'dr.wilson@medreview.com',
      password: hashedPassword,
      name: 'Dr. James Wilson',
      role: UserRole.REVIEWER,
      phone: '+1-555-0127',
      specialization: 'Orthopedic Surgery',
      licenseNumber: 'MD-67890-NY',
      bio: 'Orthopedic surgeon specializing in sports medicine and joint replacement surgeries.',
      hourlyRate: 280.0,
      availableSlots: {
        monday: ['10:00', '11:00', '14:00', '15:00', '16:00'],
        wednesday: ['09:00', '10:00', '11:00', '14:00'],
        thursday: ['10:00', '11:00', '14:00', '15:00'],
        friday: ['09:00', '10:00', '11:00', '14:00', '15:00']
      },
      isActive: true,
    }
  })

  const reviewer3 = await prisma.user.upsert({
    where: { email: 'dr.davis@medreview.com' },
    update: {},
    create: {
      email: 'dr.davis@medreview.com',
      password: hashedPassword,
      name: 'Dr. Lisa Davis',
      role: UserRole.REVIEWER,
      phone: '+1-555-0128',
      specialization: 'Radiology',
      licenseNumber: 'MD-54321-TX',
      bio: 'Diagnostic radiologist with expertise in MRI, CT, and ultrasound imaging interpretation.',
      hourlyRate: 220.0,
      availableSlots: {
        monday: ['08:00', '09:00', '10:00', '11:00', '14:00'],
        tuesday: ['08:00', '09:00', '10:00', '11:00', '14:00'],
        wednesday: ['08:00', '09:00', '10:00'],
        thursday: ['08:00', '09:00', '10:00', '11:00', '14:00'],
        friday: ['08:00', '09:00', '10:00', '11:00']
      },
      isActive: true,
    }
  })

  console.log('📋 Creating sample orders...')
  
  // Sample orders
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'MED-2025-001',
      customerId: customer1.id,
      reviewerId: reviewer1.id,
      productType: ProductType.SECOND_OPINION,
      title: 'Cardiac MRI Review',
      description: 'Please review my recent cardiac MRI results and provide a second opinion on the findings.',
      status: OrderStatus.COMPLETED,
      priority: Priority.HIGH,
      totalAmount: 350.0,
      paidAmount: 350.0,
      assignedAt: new Date('2025-01-15T10:00:00Z'),
      completedAt: new Date('2025-01-18T16:30:00Z'),
      createdAt: new Date('2025-01-15T09:00:00Z'),
    }
  })

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'MED-2025-002',
      customerId: customer2.id,
      reviewerId: reviewer2.id,
      productType: ProductType.CONSULTATION,
      title: 'Knee Surgery Consultation',
      description: 'Consultation regarding knee replacement surgery options and recovery timeline.',
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      totalAmount: 280.0,
      paidAmount: 280.0,
      assignedAt: new Date('2025-01-20T14:00:00Z'),
      createdAt: new Date('2025-01-20T13:00:00Z'),
    }
  })

  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'MED-2025-003',
      customerId: customer1.id,
      productType: ProductType.DOCUMENT_REVIEW,
      title: 'Lab Results Analysis',
      description: 'Need expert review of comprehensive blood work and lab results.',
      status: OrderStatus.PENDING_REVIEW,
      priority: Priority.MEDIUM,
      totalAmount: 180.0,
      paidAmount: 180.0,
      createdAt: new Date('2025-01-21T11:00:00Z'),
    }
  })

  console.log('📄 Creating sample documents...')
  
  // Sample documents
  await prisma.document.createMany({
    data: [
      {
        orderId: order1.id,
        fileName: 'cardiac-mri-report.pdf',
        originalName: 'Cardiac MRI Report - Sarah Johnson.pdf',
        fileSize: 2458000,
        fileType: 'application/pdf',
        filePath: '/uploads/cardiac-mri-report.pdf',
        uploadedBy: customer1.id,
      },
      {
        orderId: order1.id,
        fileName: 'cardiac-mri-images.zip',
        originalName: 'MRI Images.zip',
        fileSize: 15680000,
        fileType: 'application/zip',
        filePath: '/uploads/cardiac-mri-images.zip',
        uploadedBy: customer1.id,
      },
      {
        orderId: order2.id,
        fileName: 'knee-xray-results.pdf',
        originalName: 'Knee X-Ray Results.pdf',
        fileSize: 1235000,
        fileType: 'application/pdf',
        filePath: '/uploads/knee-xray-results.pdf',
        uploadedBy: customer2.id,
      },
      {
        orderId: order3.id,
        fileName: 'blood-work-report.pdf',
        originalName: 'Comprehensive Blood Panel - January 2025.pdf',
        fileSize: 856000,
        fileType: 'application/pdf',
        filePath: '/uploads/blood-work-report.pdf',
        uploadedBy: customer1.id,
      }
    ]
  })

  console.log('⭐ Creating sample reviews...')
  
  // Sample reviews
  const review1 = await prisma.review.create({
    data: {
      orderId: order1.id,
      reviewerId: reviewer1.id,
      title: 'Cardiac MRI Analysis - Second Opinion',
      content: `After careful review of the cardiac MRI images and report, I can provide the following assessment:

**Key Findings:**
- Left ventricular ejection fraction appears to be within normal limits (55-60%)
- No significant wall motion abnormalities detected
- Mild mitral regurgitation noted, which is common and typically benign
- No evidence of coronary artery disease on the imaging

**Clinical Interpretation:**
The cardiac MRI findings are largely reassuring. The mild mitral regurgitation is a common finding and rarely requires intervention unless symptoms develop. The preserved ejection fraction and normal wall motion suggest good cardiac function.

**Recommendations:**
1. Continue current cardiac medications as prescribed
2. Regular follow-up with your cardiologist (6-12 months)
3. Maintain heart-healthy lifestyle (diet, exercise, stress management)
4. Monitor for symptoms like chest pain, shortness of breath, or palpitations

Overall, the findings do not suggest any immediate concerns, but continued monitoring is appropriate.`,
      recommendations: 'Regular cardiology follow-up, lifestyle modifications, symptom monitoring',
      severity: 'LOW',
      isComplete: true,
      reviewTime: 45,
    }
  })

  console.log('💳 Creating sample payments...')
  
  // Sample payments
  await prisma.payment.createMany({
    data: [
      {
        orderId: order1.id,
        amount: 350.0,
        currency: 'USD',
        status: PaymentStatus.COMPLETED,
        paymentMethod: 'credit_card',
        transactionId: 'TXN-20250115-001',
        processedAt: new Date('2025-01-15T09:05:00Z'),
      },
      {
        orderId: order2.id,
        amount: 280.0,
        currency: 'USD',
        status: PaymentStatus.COMPLETED,
        paymentMethod: 'credit_card',
        transactionId: 'TXN-20250120-002',
        processedAt: new Date('2025-01-20T13:10:00Z'),
      },
      {
        orderId: order3.id,
        amount: 180.0,
        currency: 'USD',
        status: PaymentStatus.COMPLETED,
        paymentMethod: 'paypal',
        transactionId: 'TXN-20250121-003',
        paypalPaymentId: 'PAYPAL-12345',
        processedAt: new Date('2025-01-21T11:15:00Z'),
      }
    ]
  })

  console.log('📅 Creating sample consultation...')
  
  // Sample consultation
  await prisma.consultation.create({
    data: {
      orderId: order2.id,
      customerId: customer2.id,
      reviewerId: reviewer2.id,
      scheduledDate: new Date('2025-01-25T15:00:00Z'),
      duration: 60,
      status: 'SCHEDULED',
      meetingLink: 'https://meet.medreview.com/room/MED-2025-002',
      notes: 'Initial consultation to discuss knee replacement options and surgical timeline.',
    }
  })

  console.log('🔔 Creating sample notifications...')
  
  // Sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: customer1.id,
        orderId: order1.id,
        title: 'Review Completed',
        message: 'Your cardiac MRI review has been completed by Dr. Emily Smith.',
        type: NotificationType.REVIEW_COMPLETED,
        isRead: false,
        isEmailSent: true,
      },
      {
        userId: customer2.id,
        orderId: order2.id,
        title: 'Consultation Scheduled',
        message: 'Your consultation with Dr. James Wilson is scheduled for January 25, 2025 at 3:00 PM.',
        type: NotificationType.CONSULTATION_SCHEDULED,
        isRead: false,
        isEmailSent: true,
      },
      {
        userId: customer1.id,
        orderId: order3.id,
        title: 'Order Created',
        message: 'Your lab results review order has been created and is awaiting reviewer assignment.',
        type: NotificationType.ORDER_CREATED,
        isRead: true,
        isEmailSent: true,
      },
      {
        userId: reviewer1.id,
        orderId: order1.id,
        title: 'Payment Received',
        message: 'Payment of $350.00 has been received for order MED-2025-001.',
        type: NotificationType.PAYMENT_RECEIVED,
        isRead: true,
        isEmailSent: true,
      }
    ]
  })

  console.log('✅ Database seed completed successfully!')
  console.log(`📊 Created:
  - ${await prisma.user.count()} users (including test admin)
  - ${await prisma.order.count()} orders
  - ${await prisma.document.count()} documents
  - ${await prisma.review.count()} reviews
  - ${await prisma.payment.count()} payments
  - ${await prisma.consultation.count()} consultations
  - ${await prisma.notification.count()} notifications`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
