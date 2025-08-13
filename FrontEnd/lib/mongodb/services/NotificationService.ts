
import { Notification, INotification, NotificationType, NotificationPriority } from '../models/Notification';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { dbConnect } from '../connection';

export class NotificationService {
  
  static async createNotification(notificationData: {
    userId: string;
    orderId?: string;
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    actionUrl?: string;
    actionLabel?: string;
    imageUrl?: string;
    metadata?: any;
    expiresAt?: Date;
  }): Promise<INotification> {
    await dbConnect();
    
    // Verify user exists
    const user = await User.findById(notificationData.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify order exists if provided
    if (notificationData.orderId) {
      const order = await Order.findById(notificationData.orderId);
      if (!order) {
        throw new Error('Order not found');
      }
    }
    
    const notification = new Notification(notificationData);
    return await notification.save();
  }
  
  static async getNotificationById(id: string): Promise<INotification | null> {
    await dbConnect();
    
    return await Notification.findById(id)
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber title');
  }
  
  static async getNotificationsByUser(
    userId: string,
    options: {
      isRead?: boolean;
      limit?: number;
      page?: number;
      type?: NotificationType;
    } = {}
  ): Promise<{ notifications: INotification[]; total: number; pages: number }> {
    await dbConnect();
    
    const { page = 1, limit = 20, ...filters } = options;
    const skip = (page - 1) * limit;
    
    let query: any = { userId, ...filters };
    
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('orderId', 'orderNumber title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query)
    ]);
    
    return {
      notifications,
      total,
      pages: Math.ceil(total / limit)
    };
  }
  
  static async getUnreadNotifications(userId: string): Promise<INotification[]> {
    await dbConnect();
    
    return await Notification.findUnread(userId)
      .populate('orderId', 'orderNumber title');
  }
  
  static async getUnreadCount(userId: string): Promise<number> {
    await dbConnect();
    
    return await Notification.getUnreadCount(userId);
  }
  
  static async markAsRead(id: string): Promise<INotification | null> {
    await dbConnect();
    
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return await notification.markAsRead();
  }
  
  static async markAsUnread(id: string): Promise<INotification | null> {
    await dbConnect();
    
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return await notification.markAsUnread();
  }
  
  static async markAllAsRead(userId: string, type?: NotificationType): Promise<any> {
    await dbConnect();
    
    return await Notification.markAllAsRead(userId, type);
  }
  
  static async deleteNotification(id: string): Promise<boolean> {
    await dbConnect();
    
    const result = await Notification.findByIdAndDelete(id);
    return !!result;
  }
  
  static async getNotificationsByType(
    type: NotificationType,
    userId?: string
  ): Promise<INotification[]> {
    await dbConnect();
    
    return await Notification.findByType(type, userId)
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber title');
  }
  
  static async getNotificationsByPriority(
    priority: NotificationPriority,
    userId?: string
  ): Promise<INotification[]> {
    await dbConnect();
    
    return await Notification.findByPriority(priority, userId)
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber title');
  }
  
  static async getPendingEmailNotifications(): Promise<INotification[]> {
    await dbConnect();
    
    return await Notification.findPendingEmail()
      .populate('userId', 'name email phone')
      .populate('orderId', 'orderNumber title');
  }
  
  static async getPendingSMSNotifications(): Promise<INotification[]> {
    await dbConnect();
    
    return await Notification.findPendingSMS()
      .populate('userId', 'name email phone')
      .populate('orderId', 'orderNumber title');
  }
  
  static async getPendingPushNotifications(): Promise<INotification[]> {
    await dbConnect();
    
    return await Notification.findPendingPush()
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber title');
  }
  
  static async markEmailSent(id: string, emailId?: string): Promise<INotification | null> {
    await dbConnect();
    
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return await notification.markEmailSent(emailId);
  }
  
  static async markSMSSent(id: string, smsId?: string): Promise<INotification | null> {
    await dbConnect();
    
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return await notification.markSMSSent(smsId);
  }
  
  static async markPushSent(id: string, pushId?: string): Promise<INotification | null> {
    await dbConnect();
    
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return await notification.markPushSent(pushId);
  }
  
  static async extendNotificationExpiry(id: string, days: number = 30): Promise<INotification | null> {
    await dbConnect();
    
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return await notification.extend(days);
  }
  
  static async searchNotifications(
    searchTerm: string,
    filters: {
      userId?: string;
      type?: NotificationType;
      priority?: NotificationPriority;
      isRead?: boolean;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<INotification[]> {
    await dbConnect();
    
    let query: any = {
      ...filters,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { message: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }
    
    return await Notification.find(query)
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber title')
      .sort({ createdAt: -1 })
      .limit(50);
  }
  
  static async getNotificationStats(filters: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    await dbConnect();
    
    let matchQuery: any = {};
    
    if (filters.userId) matchQuery.userId = filters.userId;
    
    if (filters.startDate || filters.endDate) {
      matchQuery.createdAt = {};
      if (filters.startDate) matchQuery.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchQuery.createdAt.$lte = filters.endDate;
    }
    
    return await Notification.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          readNotifications: {
            $sum: { $cond: ['$isRead', 1, 0] }
          },
          unreadNotifications: {
            $sum: { $cond: [{ $not: '$isRead' }, 1, 0] }
          },
          emailsSent: {
            $sum: { $cond: ['$isEmailSent', 1, 0] }
          },
          smsSent: {
            $sum: { $cond: ['$isSMSSent', 1, 0] }
          },
          pushSent: {
            $sum: { $cond: ['$isPushSent', 1, 0] }
          },
          typeBreakdown: {
            $push: '$type'
          },
          priorityBreakdown: {
            $push: '$priority'
          }
        }
      }
    ]);
  }
  
  static async bulkCreateNotifications(notifications: Array<{
    userId: string;
    orderId?: string;
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: any;
  }>): Promise<INotification[]> {
    await dbConnect();
    
    // Verify all users exist
    const userIds = notifications.map(n => n.userId);
    const existingUsers = await User.find({ _id: { $in: userIds } });
    
    if (existingUsers.length !== userIds.length) {
      throw new Error('Some users not found');
    }
    
    return await Notification.insertMany(notifications);
  }
  
  static async cleanupOldNotifications(daysOld: number = 90): Promise<number> {
    await dbConnect();
    
    return await Notification.cleanup(daysOld);
  }
  
  static async getNotificationDeliveryReport(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    await dbConnect();
    
    return await Notification.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            priority: '$priority'
          },
          totalNotifications: { $sum: 1 },
          emailDelivered: { $sum: { $cond: ['$isEmailSent', 1, 0] } },
          smsDelivered: { $sum: { $cond: ['$isSMSSent', 1, 0] } },
          pushDelivered: { $sum: { $cond: ['$isPushSent', 1, 0] } },
          readRate: { 
            $avg: { $cond: ['$isRead', 1, 0] }
          },
          averageReadTime: {
            $avg: {
              $cond: [
                '$readAt',
                { $subtract: ['$readAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $sort: {
          '_id.priority': -1,
          '_id.type': 1
        }
      }
    ]);
  }
  
  static async createBulkOrderNotifications(
    orderIds: string[],
    notificationTemplate: {
      title: string;
      message: string;
      type: NotificationType;
      priority?: NotificationPriority;
    }
  ): Promise<INotification[]> {
    await dbConnect();
    
    // Get all orders with customer and reviewer info
    const orders = await Order.find({ _id: { $in: orderIds } })
      .populate('customerId reviewerId');
    
    if (orders.length === 0) {
      throw new Error('No valid orders found');
    }
    
    const notifications: any[] = [];
    
    for (const order of orders) {
      // Notification for customer
      notifications.push({
        userId: order.customerId,
        orderId: order._id,
        ...notificationTemplate
      });
      
      // Notification for reviewer if assigned
      if (order.reviewerId) {
        notifications.push({
          userId: order.reviewerId,
          orderId: order._id,
          ...notificationTemplate
        });
      }
    }
    
    return await Notification.insertMany(notifications);
  }
}
