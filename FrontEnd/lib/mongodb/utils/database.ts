
import { dbConnect } from '../connection';
import { 
  User, 
  Order, 
  Document, 
  Review, 
  Consultation, 
  Payment, 
  Notification,
  Account,
  Session,
  VerificationToken
} from '../models';

export class DatabaseUtils {
  
  /**
   * Initialize the database with indexes and constraints
   */
  static async initializeDatabase(): Promise<void> {
    await dbConnect();
    
    try {
      // Ensure all indexes are created
      await Promise.all([
        User.init(),
        Order.init(),
        Document.init(),
        Review.init(),
        Consultation.init(),
        Payment.init(),
        Notification.init(),
        Account.init(),
        Session.init(),
        VerificationToken.init()
      ]);
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }
  
  /**
   * Clean up expired data from the database
   */
  static async cleanupExpiredData(): Promise<{
    expiredSessions: number;
    expiredTokens: number;
    oldNotifications: number;
  }> {
    await dbConnect();
    
    const results = await Promise.all([
      Session.cleanExpired(),
      VerificationToken.cleanExpired(),
      Notification.cleanup(90) // Clean notifications older than 90 days
    ]);
    
    return {
      expiredSessions: results[0].deletedCount || 0,
      expiredTokens: results[1].deletedCount || 0,
      oldNotifications: results[2] || 0
    };
  }
  
  /**
   * Get database statistics
   */
  static async getDatabaseStats(): Promise<any> {
    await dbConnect();
    
    const [
      userStats,
      orderStats,
      documentStats,
      reviewStats,
      consultationStats,
      paymentStats,
      notificationStats
    ] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
            customers: { $sum: { $cond: [{ $eq: ['$role', 'CUSTOMER'] }, 1, 0] } },
            reviewers: { $sum: { $cond: [{ $eq: ['$role', 'REVIEWER'] }, 1, 0] } },
            admins: { $sum: { $cond: [{ $eq: ['$role', 'ADMIN'] }, 1, 0] } }
          }
        }
      ]),
      
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            totalPaid: { $sum: '$paidAmount' },
            pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'PENDING_REVIEW'] }, 1, 0] } },
            completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } }
          }
        }
      ]),
      
      Document.aggregate([
        {
          $group: {
            _id: null,
            totalDocuments: { $sum: 1 },
            totalSize: { $sum: '$fileSize' },
            totalDownloads: { $sum: '$downloadCount' }
          }
        }
      ]),
      
      Review.aggregate([
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            completedReviews: { $sum: { $cond: ['$isComplete', 1, 0] } },
            averageRating: { $avg: '$ratings.overall' }
          }
        }
      ]),
      
      Consultation.aggregate([
        {
          $group: {
            _id: null,
            totalConsultations: { $sum: 1 },
            completedConsultations: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
            averageDuration: { $avg: '$duration' }
          }
        }
      ]),
      
      Payment.aggregate([
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            successfulPayments: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
            totalAmount: { $sum: '$amount' },
            totalFees: { $sum: '$fee' }
          }
        }
      ]),
      
      Notification.aggregate([
        {
          $group: {
            _id: null,
            totalNotifications: { $sum: 1 },
            unreadNotifications: { $sum: { $cond: [{ $not: '$isRead' }, 1, 0] } },
            emailsSent: { $sum: { $cond: ['$isEmailSent', 1, 0] } }
          }
        }
      ])
    ]);
    
    return {
      users: userStats[0] || {},
      orders: orderStats[0] || {},
      documents: documentStats[0] || {},
      reviews: reviewStats[0] || {},
      consultations: consultationStats[0] || {},
      payments: paymentStats[0] || {},
      notifications: notificationStats[0] || {},
      generatedAt: new Date()
    };
  }
  
  /**
   * Create sample data for testing
   */
  static async createSampleData(): Promise<void> {
    await dbConnect();
    
    try {
      // Check if data already exists
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        console.log('Sample data already exists');
        return;
      }
      
      // Create sample users
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@medicalreview.com',
        role: 'ADMIN',
        isActive: true
      });
      
      const customerUser = await User.create({
        name: 'John Doe',
        email: 'customer@example.com',
        phone: '+1-555-0123',
        role: 'CUSTOMER',
        isActive: true
      });
      
      const reviewerUser = await User.create({
        name: 'Dr. Jane Smith',
        email: 'reviewer@example.com',
        phone: '+1-555-0456',
        role: 'REVIEWER',
        specialization: 'Cardiology',
        licenseNumber: 'MD12345',
        bio: 'Experienced cardiologist with 15 years of practice',
        hourlyRate: 200,
        isActive: true
      });
      
      // Create sample order
      const order = await Order.create({
        customerId: customerUser._id,
        reviewerId: reviewerUser._id,
        productType: 'SECOND_OPINION',
        title: 'Cardiac Assessment Review',
        description: 'Review of recent cardiac test results',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        totalAmount: 500,
        paidAmount: 500
      });
      
      // Create sample review
      await Review.create({
        orderId: order._id,
        reviewerId: reviewerUser._id,
        title: 'Comprehensive Cardiac Review',
        content: 'Based on the provided test results, the patient shows signs of mild cardiac stress...',
        recommendations: 'I recommend follow-up testing and lifestyle modifications.',
        severity: 'MEDIUM',
        isComplete: true,
        reviewTime: 120,
        tags: ['cardiology', 'stress-test', 'follow-up']
      });
      
      // Create sample consultation
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await Consultation.create({
        orderId: order._id,
        customerId: customerUser._id,
        reviewerId: reviewerUser._id,
        scheduledDate: tomorrow,
        duration: 60,
        status: 'SCHEDULED',
        meetingLink: 'https://meet.medicalreview.com/sample-meeting'
      });
      
      // Create sample payment
      await Payment.create({
        orderId: order._id,
        amount: 500,
        currency: 'USD',
        status: 'COMPLETED',
        paymentMethod: 'CREDIT_CARD',
        transactionId: 'txn_sample_123456',
        cardLast4: '4242',
        cardBrand: 'visa'
      });
      
      // Create sample notifications
      await Notification.insertMany([
        {
          userId: customerUser._id,
          orderId: order._id,
          title: 'Order Created',
          message: 'Your order has been created successfully',
          type: 'ORDER_CREATED',
          priority: 'MEDIUM'
        },
        {
          userId: reviewerUser._id,
          orderId: order._id,
          title: 'New Order Assignment',
          message: 'You have been assigned a new order',
          type: 'ORDER_ASSIGNED',
          priority: 'HIGH'
        }
      ]);
      
      console.log('Sample data created successfully');
      
    } catch (error) {
      console.error('Error creating sample data:', error);
      throw error;
    }
  }
  
  /**
   * Backup specific collections
   */
  static async backupData(collections: string[] = []): Promise<any> {
    await dbConnect();
    
    const defaultCollections = ['users', 'orders', 'documents', 'reviews', 'consultations', 'payments'];
    const collectionsToBackup = collections.length > 0 ? collections : defaultCollections;
    
    const backup: any = {
      timestamp: new Date(),
      collections: {}
    };
    
    for (const collectionName of collectionsToBackup) {
      let model;
      
      switch (collectionName) {
        case 'users':
          model = User;
          break;
        case 'orders':
          model = Order;
          break;
        case 'documents':
          model = Document;
          break;
        case 'reviews':
          model = Review;
          break;
        case 'consultations':
          model = Consultation;
          break;
        case 'payments':
          model = Payment;
          break;
        default:
          continue;
      }
      
      backup.collections[collectionName] = await model.find({});
    }
    
    return backup;
  }
  
  /**
   * Health check for the database
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      await dbConnect();
      
      // Test basic operations
      const userCount = await User.countDocuments();
      const orderCount = await Order.countDocuments();
      
      return {
        status: 'healthy',
        details: {
          connection: 'connected',
          userCount,
          orderCount,
          timestamp: new Date()
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connection: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }
  
  /**
   * Run database migrations
   */
  static async runMigrations(): Promise<void> {
    await dbConnect();
    
    try {
      // Add any migration logic here
      // This is where you would handle schema changes, data transformations, etc.
      
      console.log('Migrations completed successfully');
      
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
  }
}

export default DatabaseUtils;
