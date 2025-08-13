
import { DatabaseUtils } from './database';
import { dbConnect } from '../connection';
import { 
  User,
  Order,
  Review,
  Consultation,
  Payment,
  Notification,
  UserRole,
  ProductType,
  OrderStatus,
  Priority,
  ConsultationStatus,
  PaymentStatus,
  PaymentMethod,
  NotificationType,
  Severity
} from '../models';

export class SeedData {
  
  static async seedDatabase(): Promise<void> {
    await dbConnect();
    
    try {
      console.log('Starting database seeding...');
      
      // Clear existing data (optional - be careful in production)
      await this.clearDatabase();
      
      // Create users
      const users = await this.createUsers();
      console.log(`Created ${users.length} users`);
      
      // Create orders
      const orders = await this.createOrders(users);
      console.log(`Created ${orders.length} orders`);
      
      // Create reviews
      const reviews = await this.createReviews(orders, users);
      console.log(`Created ${reviews.length} reviews`);
      
      // Create consultations
      const consultations = await this.createConsultations(orders, users);
      console.log(`Created ${consultations.length} consultations`);
      
      // Create payments
      const payments = await this.createPayments(orders);
      console.log(`Created ${payments.length} payments`);
      
      // Create notifications
      const notifications = await this.createNotifications(users, orders);
      console.log(`Created ${notifications.length} notifications`);
      
      console.log('Database seeding completed successfully!');
      
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }
  
  static async clearDatabase(): Promise<void> {
    console.log('Clearing existing data...');
    
    await Promise.all([
      Notification.deleteMany({}),
      Payment.deleteMany({}),
      Consultation.deleteMany({}),
      Review.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({})
    ]);
    
    console.log('Database cleared');
  }
  
  static async createUsers(): Promise<any[]> {
    const users = [
      // Admin Users
      {
        name: 'System Administrator',
        email: 'admin@medicalreview.com',
        role: UserRole.ADMIN,
        isActive: true
      },
      {
        name: 'Platform Manager',
        email: 'manager@medicalreview.com',
        role: UserRole.ADMIN,
        isActive: true
      },
      
      // Customer Users
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0101',
        role: UserRole.CUSTOMER,
        isActive: true
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1-555-0102',
        role: UserRole.CUSTOMER,
        isActive: true
      },
      {
        name: 'Michael Davis',
        email: 'michael.davis@example.com',
        phone: '+1-555-0103',
        role: UserRole.CUSTOMER,
        isActive: true
      },
      {
        name: 'Emily Chen',
        email: 'emily.chen@example.com',
        phone: '+1-555-0104',
        role: UserRole.CUSTOMER,
        isActive: true
      },
      {
        name: 'Robert Wilson',
        email: 'robert.wilson@example.com',
        phone: '+1-555-0105',
        role: UserRole.CUSTOMER,
        isActive: true
      },
      
      // Reviewer Users (Medical Professionals)
      {
        name: 'Dr. Emma Thompson',
        email: 'dr.thompson@medicalreview.com',
        phone: '+1-555-0201',
        role: UserRole.REVIEWER,
        specialization: 'Cardiology',
        licenseNumber: 'MD001-CARD',
        bio: 'Board-certified cardiologist with 15+ years of experience in interventional cardiology and heart disease prevention.',
        hourlyRate: 250,
        isActive: true,
        availableSlots: {
          monday: ['09:00-12:00', '14:00-17:00'],
          tuesday: ['09:00-12:00', '14:00-17:00'],
          wednesday: ['09:00-12:00'],
          thursday: ['09:00-12:00', '14:00-17:00'],
          friday: ['09:00-12:00', '14:00-16:00']
        }
      },
      {
        name: 'Dr. James Rodriguez',
        email: 'dr.rodriguez@medicalreview.com',
        phone: '+1-555-0202',
        role: UserRole.REVIEWER,
        specialization: 'Neurology',
        licenseNumber: 'MD002-NEUR',
        bio: 'Neurologist specializing in stroke care, epilepsy, and neurodegenerative diseases with 12 years of clinical experience.',
        hourlyRate: 275,
        isActive: true,
        availableSlots: {
          monday: ['08:00-12:00', '13:00-17:00'],
          tuesday: ['08:00-12:00', '13:00-17:00'],
          wednesday: ['08:00-12:00', '13:00-17:00'],
          thursday: ['08:00-12:00'],
          friday: ['08:00-12:00', '13:00-15:00']
        }
      },
      {
        name: 'Dr. Lisa Park',
        email: 'dr.park@medicalreview.com',
        phone: '+1-555-0203',
        role: UserRole.REVIEWER,
        specialization: 'Oncology',
        licenseNumber: 'MD003-ONCO',
        bio: 'Medical oncologist with expertise in breast and lung cancer treatment, precision medicine, and clinical trials.',
        hourlyRate: 300,
        isActive: true,
        availableSlots: {
          monday: ['10:00-13:00', '14:00-18:00'],
          tuesday: ['10:00-13:00', '14:00-18:00'],
          wednesday: ['10:00-13:00', '14:00-18:00'],
          thursday: ['10:00-13:00', '14:00-18:00'],
          friday: ['10:00-13:00']
        }
      },
      {
        name: 'Dr. David Kumar',
        email: 'dr.kumar@medicalreview.com',
        phone: '+1-555-0204',
        role: UserRole.REVIEWER,
        specialization: 'Orthopedics',
        licenseNumber: 'MD004-ORTH',
        bio: 'Orthopedic surgeon specializing in sports medicine, joint replacement, and trauma surgery with 18 years of experience.',
        hourlyRate: 280,
        isActive: true,
        availableSlots: {
          monday: ['07:00-12:00', '13:00-16:00'],
          tuesday: ['07:00-12:00', '13:00-16:00'],
          wednesday: ['07:00-12:00', '13:00-16:00'],
          thursday: ['07:00-12:00'],
          friday: ['07:00-12:00']
        }
      },
      {
        name: 'Dr. Rachel Green',
        email: 'dr.green@medicalreview.com',
        phone: '+1-555-0205',
        role: UserRole.REVIEWER,
        specialization: 'Dermatology',
        licenseNumber: 'MD005-DERM',
        bio: 'Dermatologist with specialization in skin cancer detection, cosmetic dermatology, and pediatric dermatology.',
        hourlyRate: 225,
        isActive: true,
        availableSlots: {
          monday: ['09:00-13:00', '14:00-18:00'],
          tuesday: ['09:00-13:00', '14:00-18:00'],
          wednesday: ['09:00-13:00', '14:00-18:00'],
          thursday: ['09:00-13:00', '14:00-18:00'],
          friday: ['09:00-13:00', '14:00-17:00']
        }
      },
      {
        name: 'Dr. Anthony Lee',
        email: 'dr.lee@medicalreview.com',
        phone: '+1-555-0206',
        role: UserRole.REVIEWER,
        specialization: 'Radiology',
        licenseNumber: 'MD006-RAD',
        bio: 'Diagnostic radiologist with expertise in MRI, CT imaging, and interventional radiology procedures.',
        hourlyRate: 260,
        isActive: true,
        availableSlots: {
          monday: ['08:00-12:00', '13:00-17:00'],
          tuesday: ['08:00-12:00', '13:00-17:00'],
          wednesday: ['08:00-12:00', '13:00-17:00'],
          thursday: ['08:00-12:00', '13:00-17:00'],
          friday: ['08:00-12:00', '13:00-16:00']
        }
      }
    ];
    
    return await User.insertMany(users);
  }
  
  static async createOrders(users: any[]): Promise<any[]> {
    const customers = users.filter(u => u.role === UserRole.CUSTOMER);
    const reviewers = users.filter(u => u.role === UserRole.REVIEWER);
    
    const orders = [];
    
    for (let i = 0; i < 15; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const reviewer = i < 10 ? reviewers[Math.floor(Math.random() * reviewers.length)] : null;
      
      const orderData = {
        customerId: customer._id,
        reviewerId: reviewer?._id,
        productType: [ProductType.SECOND_OPINION, ProductType.CONSULTATION, ProductType.DOCUMENT_REVIEW][Math.floor(Math.random() * 3)],
        title: this.getRandomOrderTitle(),
        description: this.getRandomOrderDescription(),
        status: this.getRandomOrderStatus(),
        priority: [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT][Math.floor(Math.random() * 4)],
        totalAmount: Math.floor(Math.random() * 800) + 200, // $200-$1000
        paidAmount: 0,
        dueDate: new Date(Date.now() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000) // 0-14 days from now
      };
      
      // Set paid amount based on status
      if ([OrderStatus.COMPLETED, OrderStatus.IN_PROGRESS].includes(orderData.status)) {
        orderData.paidAmount = orderData.totalAmount;
      } else if (orderData.status === OrderStatus.ASSIGNED) {
        orderData.paidAmount = Math.floor(orderData.totalAmount * 0.5); // 50% paid
      }
      
      orders.push(orderData);
    }
    
    return await Order.insertMany(orders);
  }
  
  static async createReviews(orders: any[], users: any[]): Promise<any[]> {
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
    const reviews = [];
    
    for (const order of completedOrders) {
      if (order.reviewerId) {
        const reviewData = {
          orderId: order._id,
          reviewerId: order.reviewerId,
          title: this.getRandomReviewTitle(),
          content: this.getRandomReviewContent(),
          recommendations: this.getRandomRecommendations(),
          severity: [Severity.LOW, Severity.MEDIUM, Severity.HIGH][Math.floor(Math.random() * 3)],
          isComplete: true,
          reviewTime: Math.floor(Math.random() * 180) + 30, // 30-210 minutes
          tags: this.getRandomTags(),
          ratings: {
            clarity: Math.floor(Math.random() * 2) + 4, // 4-5
            accuracy: Math.floor(Math.random() * 2) + 4, // 4-5
            completeness: Math.floor(Math.random() * 2) + 4, // 4-5
          }
        };
        
        reviews.push(reviewData);
      }
    }
    
    return await Review.insertMany(reviews);
  }
  
  static async createConsultations(orders: any[], users: any[]): Promise<any[]> {
    const consultationOrders = orders.filter(o => 
      o.productType === ProductType.CONSULTATION && o.reviewerId
    );
    
    const consultations = [];
    
    for (const order of consultationOrders.slice(0, 8)) { // Create 8 consultations
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * 30)); // Next 30 days
      scheduledDate.setHours(Math.floor(Math.random() * 8) + 9); // 9 AM - 5 PM
      scheduledDate.setMinutes([0, 15, 30, 45][Math.floor(Math.random() * 4)]);
      
      const consultationData = {
        orderId: order._id,
        customerId: order.customerId,
        reviewerId: order.reviewerId,
        scheduledDate,
        duration: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
        status: [ConsultationStatus.SCHEDULED, ConsultationStatus.COMPLETED][Math.floor(Math.random() * 2)],
        meetingLink: `https://meet.medicalreview.com/consultation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        notes: this.getRandomConsultationNotes()
      };
      
      // Add ratings for completed consultations
      if (consultationData.status === ConsultationStatus.COMPLETED) {
        consultationData.actualStartTime = new Date(scheduledDate.getTime() - consultationData.duration * 60000);
        consultationData.actualEndTime = scheduledDate;
        consultationData.rating = {
          customerRating: Math.floor(Math.random() * 2) + 4, // 4-5
          reviewerRating: Math.floor(Math.random() * 2) + 4, // 4-5
          customerFeedback: 'Very helpful consultation, doctor explained everything clearly.',
          reviewerFeedback: 'Patient was well-prepared and engaged throughout the session.'
        };
      }
      
      consultations.push(consultationData);
    }
    
    return await Consultation.insertMany(consultations);
  }
  
  static async createPayments(orders: any[]): Promise<any[]> {
    const paidOrders = orders.filter(o => o.paidAmount > 0);
    const payments = [];
    
    for (const order of paidOrders) {
      const paymentData = {
        orderId: order._id,
        amount: order.paidAmount,
        currency: 'USD',
        status: PaymentStatus.COMPLETED,
        paymentMethod: [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.PAYPAL][Math.floor(Math.random() * 3)],
        paymentProvider: 'stripe',
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cardLast4: Math.floor(Math.random() * 9000) + 1000,
        cardBrand: ['visa', 'mastercard', 'amex'][Math.floor(Math.random() * 3)],
        fee: Math.floor(order.paidAmount * 0.029) + 30, // 2.9% + $0.30 fee
        processedAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) // Last 7 days
      };
      
      paymentData.netAmount = paymentData.amount - paymentData.fee;
      
      payments.push(paymentData);
    }
    
    return await Payment.insertMany(payments);
  }
  
  static async createNotifications(users: any[], orders: any[]): Promise<any[]> {
    const notifications = [];
    
    // Create various types of notifications
    const notificationTypes = [
      NotificationType.ORDER_CREATED,
      NotificationType.ORDER_ASSIGNED,
      NotificationType.ORDER_UPDATED,
      NotificationType.REVIEW_COMPLETED,
      NotificationType.CONSULTATION_SCHEDULED,
      NotificationType.PAYMENT_RECEIVED,
      NotificationType.DOCUMENT_UPLOADED
    ];
    
    for (let i = 0; i < 50; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const order = orders[Math.floor(Math.random() * orders.length)];
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      
      const notificationData = {
        userId: user._id,
        orderId: order._id,
        title: this.getNotificationTitle(type),
        message: this.getNotificationMessage(type, order.title),
        type,
        priority: [NotificationPriority.LOW, NotificationPriority.MEDIUM, NotificationPriority.HIGH][Math.floor(Math.random() * 3)],
        isRead: Math.random() > 0.4, // 60% read rate
        isEmailSent: Math.random() > 0.2, // 80% email sent rate
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Last 30 days
      };
      
      if (notificationData.isRead) {
        notificationData.readAt = new Date(notificationData.createdAt.getTime() + Math.floor(Math.random() * 24) * 60 * 60 * 1000);
      }
      
      if (notificationData.isEmailSent) {
        notificationData.emailSentAt = new Date(notificationData.createdAt.getTime() + Math.floor(Math.random() * 60) * 60 * 1000);
      }
      
      notifications.push(notificationData);
    }
    
    return await Notification.insertMany(notifications);
  }
  
  // Helper methods for generating random data
  static getRandomOrderTitle(): string {
    const titles = [
      'Cardiac Test Results Review',
      'MRI Scan Analysis',
      'Blood Work Interpretation',
      'X-Ray Report Second Opinion',
      'Biopsy Results Review',
      'CT Scan Evaluation',
      'Ultrasound Report Analysis',
      'Lab Results Consultation',
      'Pathology Report Review',
      'EKG Reading Second Opinion',
      'Mammography Report Analysis',
      'Dermatology Photo Review',
      'Orthopedic Imaging Review',
      'Neurological Assessment',
      'Endocrinology Lab Review'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }
  
  static getRandomOrderDescription(): string {
    const descriptions = [
      'Request for second opinion on recent test results and treatment recommendations.',
      'Need expert review of diagnostic imaging and proposed treatment plan.',
      'Seeking additional perspective on complex case with multiple symptoms.',
      'Looking for validation of current diagnosis and treatment approach.',
      'Request for specialist review before proceeding with recommended procedure.',
      'Need clarification on test results and their clinical significance.',
      'Seeking expert opinion on treatment options and prognosis.',
      'Request for review of pathology results and staging information.',
      'Need second opinion on surgical recommendation and alternatives.',
      'Looking for expert interpretation of complex imaging studies.'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }
  
  static getRandomOrderStatus(): OrderStatus {
    const statuses = [OrderStatus.PENDING_REVIEW, OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED];
    const weights = [0.2, 0.3, 0.3, 0.2]; // 20% pending, 30% assigned, 30% in progress, 20% completed
    
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < statuses.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return statuses[i];
      }
    }
    
    return OrderStatus.PENDING_REVIEW;
  }
  
  static getRandomReviewTitle(): string {
    const titles = [
      'Comprehensive Medical Review',
      'Diagnostic Assessment Report',
      'Clinical Case Analysis',
      'Treatment Recommendation Review',
      'Medical Opinion Summary',
      'Specialist Consultation Report',
      'Expert Medical Analysis',
      'Clinical Review and Recommendations',
      'Medical Case Evaluation',
      'Professional Medical Opinion'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }
  
  static getRandomReviewContent(): string {
    const contents = [
      'After thorough review of the provided medical records and test results, I have conducted a comprehensive analysis of the patient\'s condition. The diagnostic findings are consistent with the clinical presentation, and I have identified several key areas that require attention.',
      'Based on my evaluation of the submitted documentation, including laboratory results, imaging studies, and clinical history, I can provide the following professional assessment and recommendations for this case.',
      'This case presents an interesting clinical scenario that requires careful consideration of multiple factors. After reviewing all available data, I have formulated a detailed analysis of the patient\'s condition and appropriate treatment approach.',
      'The medical records provided demonstrate a complex case with multiple clinical considerations. My review focuses on the diagnostic accuracy, treatment appropriateness, and potential alternative approaches that may be beneficial.',
      'Following my detailed review of the patient\'s medical history, current symptoms, and diagnostic test results, I can offer the following professional medical opinion and treatment recommendations.'
    ];
    return contents[Math.floor(Math.random() * contents.length)];
  }
  
  static getRandomRecommendations(): string {
    const recommendations = [
      'I recommend follow-up testing in 3-6 months to monitor progression. Consider lifestyle modifications including diet and exercise. Medication adjustment may be necessary based on response to treatment.',
      'Suggest additional imaging studies to rule out complications. Patient should continue current treatment regimen with close monitoring. Consider referral to specialist if symptoms persist.',
      'Recommend immediate follow-up with primary care physician. Lab work should be repeated in 4 weeks. Patient education regarding warning signs is essential.',
      'Consider alternative treatment options if current approach is not effective. Regular monitoring of key indicators is recommended. Lifestyle modifications strongly advised.',
      'Suggest multidisciplinary approach involving relevant specialists. Patient should be monitored closely for any changes in condition. Additional diagnostic testing may be warranted.'
    ];
    return recommendations[Math.floor(Math.random() * recommendations.length)];
  }
  
  static getRandomTags(): string[] {
    const allTags = [
      'cardiology', 'neurology', 'oncology', 'orthopedics', 'dermatology',
      'radiology', 'urgent', 'follow-up', 'second-opinion', 'complex-case',
      'imaging', 'laboratory', 'biopsy', 'treatment-plan', 'medication',
      'surgery', 'consultation', 'specialist', 'monitoring', 'lifestyle'
    ];
    
    const numTags = Math.floor(Math.random() * 5) + 1; // 1-5 tags
    const shuffled = allTags.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numTags);
  }
  
  static getRandomConsultationNotes(): string {
    const notes = [
      'Productive consultation with clear discussion of treatment options and patient concerns.',
      'Patient presented well-prepared with relevant questions. Good understanding of condition demonstrated.',
      'Comprehensive review of case with detailed explanation of findings and recommendations.',
      'Patient expressed satisfaction with consultation and clarity of information provided.',
      'Effective communication established. Patient comfortable with proposed treatment plan.',
      'Consultation covered all patient concerns with appropriate follow-up recommendations.'
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }
  
  static getNotificationTitle(type: NotificationType): string {
    const titleMap = {
      [NotificationType.ORDER_CREATED]: 'Order Created Successfully',
      [NotificationType.ORDER_ASSIGNED]: 'Order Assigned to Reviewer',
      [NotificationType.ORDER_UPDATED]: 'Order Status Updated',
      [NotificationType.REVIEW_COMPLETED]: 'Medical Review Completed',
      [NotificationType.CONSULTATION_SCHEDULED]: 'Consultation Scheduled',
      [NotificationType.PAYMENT_RECEIVED]: 'Payment Processed',
      [NotificationType.DOCUMENT_UPLOADED]: 'New Document Uploaded',
      [NotificationType.PAYMENT_FAILED]: 'Payment Failed',
      [NotificationType.REMINDER]: 'Reminder',
      [NotificationType.SYSTEM]: 'System Notification',
      [NotificationType.GENERAL]: 'General Notification'
    };
    return titleMap[type] || 'Notification';
  }
  
  static getNotificationMessage(type: NotificationType, orderTitle: string): string {
    const messageMap = {
      [NotificationType.ORDER_CREATED]: `Your order "${orderTitle}" has been created successfully and is pending review.`,
      [NotificationType.ORDER_ASSIGNED]: `Your order "${orderTitle}" has been assigned to a medical reviewer.`,
      [NotificationType.ORDER_UPDATED]: `The status of your order "${orderTitle}" has been updated.`,
      [NotificationType.REVIEW_COMPLETED]: `The medical review for "${orderTitle}" has been completed and is now available.`,
      [NotificationType.CONSULTATION_SCHEDULED]: `A consultation has been scheduled for your order "${orderTitle}".`,
      [NotificationType.PAYMENT_RECEIVED]: `Payment has been processed successfully for "${orderTitle}".`,
      [NotificationType.DOCUMENT_UPLOADED]: `A new document has been uploaded for "${orderTitle}".`,
      [NotificationType.PAYMENT_FAILED]: `Payment processing failed for "${orderTitle}". Please try again.`,
      [NotificationType.REMINDER]: `This is a reminder regarding your order "${orderTitle}".`,
      [NotificationType.SYSTEM]: `System notification regarding "${orderTitle}".`,
      [NotificationType.GENERAL]: `General notification about "${orderTitle}".`
    };
    return messageMap[type] || `Notification regarding "${orderTitle}".`;
  }
}

// Export the seed function for use in scripts
export const seedDatabase = SeedData.seedDatabase;
export default SeedData;
