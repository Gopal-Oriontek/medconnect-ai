
import mongoose, { Schema, Document, Model } from 'mongoose';

// Enums
export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_ASSIGNED = 'ORDER_ASSIGNED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  REVIEW_COMPLETED = 'REVIEW_COMPLETED',
  CONSULTATION_SCHEDULED = 'CONSULTATION_SCHEDULED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  REMINDER = 'REMINDER',
  SYSTEM = 'SYSTEM',
  GENERAL = 'GENERAL'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Interface for Notification document
export interface INotification extends Document {
  _id: string;
  userId: Schema.Types.ObjectId;
  orderId?: Schema.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  isEmailSent: boolean;
  isSMSSent: boolean;
  isPushSent: boolean;
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  metadata?: {
    emailId?: string;
    smsId?: string;
    pushId?: string;
    retryCount?: number;
    [key: string]: any;
  };
  readAt?: Date;
  emailSentAt?: Date;
  smsSentAt?: Date;
  pushSentAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Schema
const NotificationSchema: Schema<INotification> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true
  },
  priority: {
    type: String,
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.MEDIUM
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isEmailSent: {
    type: Boolean,
    default: false
  },
  isSMSSent: {
    type: Boolean,
    default: false
  },
  isPushSent: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    trim: true
  },
  actionLabel: {
    type: String,
    trim: true,
    maxlength: 50
  },
  imageUrl: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  readAt: {
    type: Date,
    default: null
  },
  emailSentAt: {
    type: Date,
    default: null
  },
  smsSentAt: {
    type: Date,
    default: null
  },
  pushSentAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiry: 30 days from creation
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ orderId: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Compound indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ userId: 1, priority: 1, createdAt: -1 });
NotificationSchema.index({ isEmailSent: 1, emailSentAt: 1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

// Virtual for user
NotificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for order
NotificationSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for is expired
NotificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for time ago
NotificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
});

// Virtual for delivery status
NotificationSchema.virtual('deliveryStatus').get(function() {
  const statuses = [];
  if (this.isEmailSent) statuses.push('email');
  if (this.isSMSSent) statuses.push('sms');
  if (this.isPushSent) statuses.push('push');
  return statuses;
});

// Pre-save middleware
NotificationSchema.pre('save', function(next) {
  // Set readAt when isRead changes to true
  if (this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  
  // Set sent timestamps
  if (this.isEmailSent && !this.emailSentAt) {
    this.emailSentAt = new Date();
  }
  
  if (this.isSMSSent && !this.smsSentAt) {
    this.smsSentAt = new Date();
  }
  
  if (this.isPushSent && !this.pushSentAt) {
    this.pushSentAt = new Date();
  }
  
  next();
});

// Static methods
NotificationSchema.statics.findByUser = function(userId: string, options?: { limit?: number; isRead?: boolean }) {
  const query: any = { userId };
  if (options?.isRead !== undefined) {
    query.isRead = options.isRead;
  }
  
  let queryBuilder = this.find(query).sort({ createdAt: -1 });
  
  if (options?.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  return queryBuilder;
};

NotificationSchema.statics.findUnread = function(userId: string) {
  return this.find({ userId, isRead: false }).sort({ createdAt: -1 });
};

NotificationSchema.statics.findByType = function(type: NotificationType, userId?: string) {
  const query: any = { type };
  if (userId) query.userId = userId;
  return this.find(query).sort({ createdAt: -1 });
};

NotificationSchema.statics.findByPriority = function(priority: NotificationPriority, userId?: string) {
  const query: any = { priority };
  if (userId) query.userId = userId;
  return this.find(query).sort({ createdAt: -1 });
};

NotificationSchema.statics.findPendingEmail = function() {
  return this.find({
    isEmailSent: false,
    expiresAt: { $gt: new Date() }
  }).sort({ priority: -1, createdAt: 1 });
};

NotificationSchema.statics.findPendingSMS = function() {
  return this.find({
    isSMSSent: false,
    priority: { $in: [NotificationPriority.HIGH, NotificationPriority.URGENT] },
    expiresAt: { $gt: new Date() }
  }).sort({ priority: -1, createdAt: 1 });
};

NotificationSchema.statics.findPendingPush = function() {
  return this.find({
    isPushSent: false,
    expiresAt: { $gt: new Date() }
  }).sort({ priority: -1, createdAt: 1 });
};

NotificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({ userId, isRead: false });
};

NotificationSchema.statics.markAllAsRead = function(userId: string, type?: NotificationType) {
  const query: any = { userId, isRead: false };
  if (type) query.type = type;
  
  return this.updateMany(query, { 
    isRead: true, 
    readAt: new Date() 
  });
};

NotificationSchema.statics.cleanup = function(daysOld: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

// Instance methods
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.readAt = null;
  return this.save();
};

NotificationSchema.methods.markEmailSent = function(emailId?: string) {
  this.isEmailSent = true;
  this.emailSentAt = new Date();
  if (emailId && this.metadata) {
    this.metadata.emailId = emailId;
  }
  return this.save();
};

NotificationSchema.methods.markSMSSent = function(smsId?: string) {
  this.isSMSSent = true;
  this.smsSentAt = new Date();
  if (smsId && this.metadata) {
    this.metadata.smsId = smsId;
  }
  return this.save();
};

NotificationSchema.methods.markPushSent = function(pushId?: string) {
  this.isPushSent = true;
  this.pushSentAt = new Date();
  if (pushId && this.metadata) {
    this.metadata.pushId = pushId;
  }
  return this.save();
};

NotificationSchema.methods.extend = function(days: number = 30) {
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + days);
  this.expiresAt = newExpiry;
  return this.save();
};

// Create and export the model
const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
