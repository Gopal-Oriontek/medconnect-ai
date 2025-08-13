
import { Consultation, IConsultation, ConsultationStatus } from '../models/Consultation';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Notification, NotificationType } from '../models/Notification';
import { dbConnect } from '../connection';

export class ConsultationService {
  
  static async scheduleConsultation(consultationData: {
    orderId: string;
    customerId: string;
    reviewerId: string;
    scheduledDate: Date;
    duration?: number;
    meetingLink?: string;
  }): Promise<IConsultation> {
    await dbConnect();
    
    // Verify order exists
    const order = await Order.findById(consultationData.orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Verify participants
    const [customer, reviewer] = await Promise.all([
      User.findById(consultationData.customerId),
      User.findById(consultationData.reviewerId)
    ]);
    
    if (!customer || !reviewer) {
      throw new Error('Invalid participants');
    }
    
    if (!reviewer.isReviewer()) {
      throw new Error('User is not a reviewer');
    }
    
    // Check if scheduled date is in the future
    if (consultationData.scheduledDate <= new Date()) {
      throw new Error('Scheduled date must be in the future');
    }
    
    // Generate meeting ID and link if not provided
    if (!consultationData.meetingLink) {
      const meetingId = `consult_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      consultationData.meetingLink = `https://meet.medicalreview.com/${meetingId}`;
    }
    
    const consultation = new Consultation(consultationData);
    const savedConsultation = await consultation.save();
    
    // Notifications are created in the model's post-save hook
    
    return savedConsultation;
  }
  
  static async getConsultationById(id: string): Promise<IConsultation | null> {
    await dbConnect();
    
    return await Consultation.findById(id)
      .populate([
        { path: 'orderId', select: 'orderNumber title' },
        { path: 'customerId', select: 'name email phone' },
        { path: 'reviewerId', select: 'name email specialization' }
      ]);
  }
  
  static async getConsultationsByOrder(orderId: string): Promise<IConsultation[]> {
    await dbConnect();
    
    return await Consultation.findByOrder(orderId)
      .populate([
        { path: 'customerId', select: 'name email' },
        { path: 'reviewerId', select: 'name email specialization' }
      ]);
  }
  
  static async getConsultationsByCustomer(
    customerId: string,
    options: {
      status?: ConsultationStatus;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ consultations: IConsultation[]; total: number; pages: number }> {
    await dbConnect();
    
    const { page = 1, limit = 20, ...filters } = options;
    const skip = (page - 1) * limit;
    
    let query: any = { customerId, ...filters };
    
    const [consultations, total] = await Promise.all([
      Consultation.find(query)
        .populate([
          { path: 'orderId', select: 'orderNumber title' },
          { path: 'reviewerId', select: 'name specialization' }
        ])
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limit),
      Consultation.countDocuments(query)
    ]);
    
    return {
      consultations,
      total,
      pages: Math.ceil(total / limit)
    };
  }
  
  static async getConsultationsByReviewer(
    reviewerId: string,
    options: {
      status?: ConsultationStatus;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ consultations: IConsultation[]; total: number; pages: number }> {
    await dbConnect();
    
    const { page = 1, limit = 20, ...filters } = options;
    const skip = (page - 1) * limit;
    
    let query: any = { reviewerId, ...filters };
    
    const [consultations, total] = await Promise.all([
      Consultation.find(query)
        .populate([
          { path: 'orderId', select: 'orderNumber title' },
          { path: 'customerId', select: 'name email phone' }
        ])
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(limit),
      Consultation.countDocuments(query)
    ]);
    
    return {
      consultations,
      total,
      pages: Math.ceil(total / limit)
    };
  }
  
  static async getUpcomingConsultations(userId?: string): Promise<IConsultation[]> {
    await dbConnect();
    
    return await Consultation.findUpcoming(userId)
      .populate([
        { path: 'orderId', select: 'orderNumber title' },
        { path: 'customerId', select: 'name email phone' },
        { path: 'reviewerId', select: 'name email specialization' }
      ]);
  }
  
  static async startConsultation(id: string): Promise<IConsultation | null> {
    await dbConnect();
    
    const consultation = await Consultation.findById(id);
    if (!consultation) {
      throw new Error('Consultation not found');
    }
    
    if (consultation.status !== ConsultationStatus.SCHEDULED) {
      throw new Error('Consultation cannot be started');
    }
    
    return await consultation.start();
  }
  
  static async completeConsultation(
    id: string,
    data: {
      notes?: string;
      customerNotes?: string;
      reviewerNotes?: string;
      recordingUrl?: string;
      transcriptUrl?: string;
    }
  ): Promise<IConsultation | null> {
    await dbConnect();
    
    const consultation = await Consultation.findById(id);
    if (!consultation) {
      throw new Error('Consultation not found');
    }
    
    if (consultation.status !== ConsultationStatus.IN_PROGRESS) {
      throw new Error('Consultation is not in progress');
    }
    
    // Update consultation data
    Object.assign(consultation, data);
    
    return await consultation.complete(data.notes);
  }
  
  static async cancelConsultation(id: string, reason?: string): Promise<IConsultation | null> {
    await dbConnect();
    
    const consultation = await Consultation.findById(id);
    if (!consultation) {
      throw new Error('Consultation not found');
    }
    
    if (![ConsultationStatus.SCHEDULED, ConsultationStatus.IN_PROGRESS].includes(consultation.status)) {
      throw new Error('Consultation cannot be cancelled');
    }
    
    await consultation.cancel(reason);
    
    // Create notification for participants
    const notifications = [
      {
        userId: consultation.customerId,
        orderId: consultation.orderId,
        title: 'Consultation Cancelled',
        message: `Your consultation has been cancelled${reason ? `: ${reason}` : ''}`,
        type: NotificationType.CONSULTATION_SCHEDULED
      },
      {
        userId: consultation.reviewerId,
        orderId: consultation.orderId,
        title: 'Consultation Cancelled',
        message: `Consultation has been cancelled${reason ? `: ${reason}` : ''}`,
        type: NotificationType.CONSULTATION_SCHEDULED
      }
    ];
    
    await Notification.insertMany(notifications);
    
    return consultation;
  }
  
  static async rescheduleConsultation(
    id: string,
    newDate: Date,
    reason: string,
    rescheduledBy: string
  ): Promise<IConsultation | null> {
    await dbConnect();
    
    const consultation = await Consultation.findById(id);
    if (!consultation) {
      throw new Error('Consultation not found');
    }
    
    if (consultation.status !== ConsultationStatus.SCHEDULED) {
      throw new Error('Only scheduled consultations can be rescheduled');
    }
    
    if (newDate <= new Date()) {
      throw new Error('New scheduled date must be in the future');
    }
    
    await consultation.reschedule(newDate, reason, rescheduledBy);
    
    // Create notifications for participants
    const notifications = [
      {
        userId: consultation.customerId,
        orderId: consultation.orderId,
        title: 'Consultation Rescheduled',
        message: `Your consultation has been rescheduled to ${newDate.toLocaleString()}`,
        type: NotificationType.CONSULTATION_SCHEDULED
      },
      {
        userId: consultation.reviewerId,
        orderId: consultation.orderId,
        title: 'Consultation Rescheduled',
        message: `Consultation has been rescheduled to ${newDate.toLocaleString()}`,
        type: NotificationType.CONSULTATION_SCHEDULED
      }
    ];
    
    await Notification.insertMany(notifications);
    
    return consultation;
  }
  
  static async addConsultationRating(
    id: string,
    rating: {
      customerRating?: number;
      reviewerRating?: number;
      customerFeedback?: string;
      reviewerFeedback?: string;
    }
  ): Promise<IConsultation | null> {
    await dbConnect();
    
    // Validate ratings
    if (rating.customerRating && (rating.customerRating < 1 || rating.customerRating > 5)) {
      throw new Error('Customer rating must be between 1 and 5');
    }
    
    if (rating.reviewerRating && (rating.reviewerRating < 1 || rating.reviewerRating > 5)) {
      throw new Error('Reviewer rating must be between 1 and 5');
    }
    
    return await Consultation.findByIdAndUpdate(
      id,
      { rating },
      { new: true, runValidators: true }
    );
  }
  
  static async getPastDueConsultations(): Promise<IConsultation[]> {
    await dbConnect();
    
    return await Consultation.findPastDue()
      .populate([
        { path: 'orderId', select: 'orderNumber title' },
        { path: 'customerId', select: 'name email phone' },
        { path: 'reviewerId', select: 'name email' }
      ]);
  }
  
  static async getConsultationsForReminders(timeInMinutes: number): Promise<IConsultation[]> {
    await dbConnect();
    
    return await Consultation.findForReminders(timeInMinutes)
      .populate([
        { path: 'customerId', select: 'name email phone' },
        { path: 'reviewerId', select: 'name email' }
      ]);
  }
  
  static async sendReminder(id: string, type: '24h' | '1h' | '15min'): Promise<boolean> {
    await dbConnect();
    
    const consultation = await Consultation.findById(id)
      .populate([
        { path: 'customerId', select: 'name email' },
        { path: 'reviewerId', select: 'name email' }
      ]);
    
    if (!consultation) {
      throw new Error('Consultation not found');
    }
    
    await consultation.setReminder(type);
    
    const timeMap = {
      '24h': '24 hours',
      '1h': '1 hour',
      '15min': '15 minutes'
    };
    
    // Create notification reminders
    const notifications = [
      {
        userId: consultation.customerId,
        orderId: consultation.orderId,
        title: 'Consultation Reminder',
        message: `Your consultation is scheduled in ${timeMap[type]}`,
        type: NotificationType.REMINDER
      },
      {
        userId: consultation.reviewerId,
        orderId: consultation.orderId,
        title: 'Consultation Reminder',
        message: `You have a consultation scheduled in ${timeMap[type]}`,
        type: NotificationType.REMINDER
      }
    ];
    
    await Notification.insertMany(notifications);
    
    return true;
  }
  
  static async getConsultationStats(filters: {
    reviewerId?: string;
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    await dbConnect();
    
    let matchQuery: any = {};
    
    if (filters.reviewerId) matchQuery.reviewerId = filters.reviewerId;
    if (filters.customerId) matchQuery.customerId = filters.customerId;
    
    if (filters.startDate || filters.endDate) {
      matchQuery.scheduledDate = {};
      if (filters.startDate) matchQuery.scheduledDate.$gte = filters.startDate;
      if (filters.endDate) matchQuery.scheduledDate.$lte = filters.endDate;
    }
    
    return await Consultation.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalConsultations: { $sum: 1 },
          scheduledConsultations: {
            $sum: { $cond: [{ $eq: ['$status', 'SCHEDULED'] }, 1, 0] }
          },
          completedConsultations: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          cancelledConsultations: {
            $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
          },
          averageDuration: { $avg: '$duration' },
          averageActualDuration: { $avg: '$actualDuration' },
          averageRating: {
            $avg: {
              $avg: ['$rating.customerRating', '$rating.reviewerRating']
            }
          }
        }
      }
    ]);
  }
  
  static async updateConsultation(id: string, updates: Partial<IConsultation>): Promise<IConsultation | null> {
    await dbConnect();
    
    // Prevent updating certain fields
    const { _id, orderId, customerId, reviewerId, createdAt, ...safeUpdates } = updates;
    
    return await Consultation.findByIdAndUpdate(
      id,
      safeUpdates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'orderId', select: 'orderNumber title' },
      { path: 'customerId', select: 'name email phone' },
      { path: 'reviewerId', select: 'name email specialization' }
    ]);
  }
}
