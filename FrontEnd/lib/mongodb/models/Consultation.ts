
import mongoose, { Schema, Document, Model } from 'mongoose';

// Enums
export enum ConsultationStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
}

// Interface for Consultation document
export interface IConsultation extends Document {
  _id: string;
  orderId: Schema.Types.ObjectId;
  customerId: Schema.Types.ObjectId;
  reviewerId: Schema.Types.ObjectId;
  scheduledDate: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  duration: number; // minutes
  status: ConsultationStatus;
  meetingLink?: string;
  meetingId?: string;
  roomId?: string;
  notes?: string;
  customerNotes?: string;
  reviewerNotes?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  attachments?: string[];
  rating?: {
    customerRating?: number;
    reviewerRating?: number;
    customerFeedback?: string;
    reviewerFeedback?: string;
  };
  reminders?: {
    sent24h?: boolean;
    sent1h?: boolean;
    sent15min?: boolean;
  };
  rescheduleHistory?: {
    previousDate: Date;
    reason: string;
    rescheduledBy: Schema.Types.ObjectId;
    rescheduledAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Consultation Schema
const ConsultationSchema: Schema<IConsultation> = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(date: Date) {
        return date > new Date();
      },
      message: 'Scheduled date must be in the future'
    }
  },
  actualStartTime: {
    type: Date,
    default: null
  },
  actualEndTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    required: true,
    default: 60,
    min: 15,
    max: 180 // Max 3 hours
  },
  status: {
    type: String,
    enum: Object.values(ConsultationStatus),
    default: ConsultationStatus.SCHEDULED
  },
  meetingLink: {
    type: String,
    trim: true
  },
  meetingId: {
    type: String,
    trim: true
  },
  roomId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  customerNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  reviewerNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  recordingUrl: {
    type: String,
    trim: true
  },
  transcriptUrl: {
    type: String,
    trim: true
  },
  attachments: [{
    type: String,
    trim: true
  }],
  rating: {
    customerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    reviewerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    customerFeedback: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    reviewerFeedback: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  reminders: {
    sent24h: {
      type: Boolean,
      default: false
    },
    sent1h: {
      type: Boolean,
      default: false
    },
    sent15min: {
      type: Boolean,
      default: false
    }
  },
  rescheduleHistory: [{
    previousDate: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    rescheduledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rescheduledAt: {
      type: Date,
      default: Date.now
    }
  }]
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
ConsultationSchema.index({ orderId: 1 });
ConsultationSchema.index({ customerId: 1 });
ConsultationSchema.index({ reviewerId: 1 });
ConsultationSchema.index({ scheduledDate: 1 });
ConsultationSchema.index({ status: 1 });
ConsultationSchema.index({ meetingId: 1 });

// Compound indexes
ConsultationSchema.index({ status: 1, scheduledDate: 1 });
ConsultationSchema.index({ reviewerId: 1, status: 1, scheduledDate: 1 });
ConsultationSchema.index({ customerId: 1, status: 1, scheduledDate: 1 });

// Virtual for order
ConsultationSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for customer
ConsultationSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for reviewer
ConsultationSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for actual duration
ConsultationSchema.virtual('actualDuration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime.getTime() - this.actualStartTime.getTime()) / 60000);
  }
  return null;
});

// Virtual for is upcoming
ConsultationSchema.virtual('isUpcoming').get(function() {
  return this.scheduledDate > new Date() && this.status === ConsultationStatus.SCHEDULED;
});

// Virtual for is past due
ConsultationSchema.virtual('isPastDue').get(function() {
  return this.scheduledDate < new Date() && this.status === ConsultationStatus.SCHEDULED;
});

// Virtual for time until consultation
ConsultationSchema.virtual('timeUntil').get(function() {
  if (this.scheduledDate <= new Date()) return null;
  
  const diff = this.scheduledDate.getTime() - new Date().getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
});

// Virtual for average rating
ConsultationSchema.virtual('averageRating').get(function() {
  if (!this.rating) return null;
  
  const ratings = [this.rating.customerRating, this.rating.reviewerRating]
    .filter(r => typeof r === 'number');
  
  if (ratings.length === 0) return null;
  
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Pre-save middleware
ConsultationSchema.pre('save', function(next) {
  // Validate that scheduled date is not in the past for new consultations
  if (this.isNew && this.scheduledDate <= new Date()) {
    next(new Error('Scheduled date cannot be in the past'));
    return;
  }
  
  // Set actualStartTime when status changes to IN_PROGRESS
  if (this.status === ConsultationStatus.IN_PROGRESS && !this.actualStartTime) {
    this.actualStartTime = new Date();
  }
  
  // Set actualEndTime when status changes to COMPLETED
  if (this.status === ConsultationStatus.COMPLETED && !this.actualEndTime) {
    this.actualEndTime = new Date();
  }
  
  next();
});

// Post-save middleware
ConsultationSchema.post('save', async function(doc) {
  // Create notification when consultation is scheduled
  if (doc.isNew && doc.status === ConsultationStatus.SCHEDULED) {
    const Notification = mongoose.model('Notification');
    await Notification.create([
      {
        userId: doc.customerId,
        orderId: doc.orderId,
        title: 'Consultation Scheduled',
        message: `Your consultation has been scheduled for ${doc.scheduledDate.toLocaleString()}`,
        type: 'CONSULTATION_SCHEDULED'
      },
      {
        userId: doc.reviewerId,
        orderId: doc.orderId,
        title: 'Consultation Scheduled',
        message: `You have a new consultation scheduled for ${doc.scheduledDate.toLocaleString()}`,
        type: 'CONSULTATION_SCHEDULED'
      }
    ]);
  }
});

// Static methods
ConsultationSchema.statics.findByOrder = function(orderId: string) {
  return this.find({ orderId }).sort({ scheduledDate: 1 });
};

ConsultationSchema.statics.findByCustomer = function(customerId: string) {
  return this.find({ customerId }).sort({ scheduledDate: -1 });
};

ConsultationSchema.statics.findByReviewer = function(reviewerId: string) {
  return this.find({ reviewerId }).sort({ scheduledDate: 1 });
};

ConsultationSchema.statics.findUpcoming = function(userId?: string) {
  const query: any = {
    scheduledDate: { $gt: new Date() },
    status: ConsultationStatus.SCHEDULED
  };
  
  if (userId) {
    query.$or = [
      { customerId: userId },
      { reviewerId: userId }
    ];
  }
  
  return this.find(query).sort({ scheduledDate: 1 });
};

ConsultationSchema.statics.findPastDue = function() {
  return this.find({
    scheduledDate: { $lt: new Date() },
    status: ConsultationStatus.SCHEDULED
  }).sort({ scheduledDate: 1 });
};

ConsultationSchema.statics.findForReminders = function(timeInMinutes: number) {
  const targetTime = new Date();
  targetTime.setMinutes(targetTime.getMinutes() + timeInMinutes);
  
  const reminderField = timeInMinutes === 1440 ? 'reminders.sent24h' :
                       timeInMinutes === 60 ? 'reminders.sent1h' :
                       timeInMinutes === 15 ? 'reminders.sent15min' : null;
  
  if (!reminderField) return this.find({ _id: null });
  
  return this.find({
    scheduledDate: {
      $gte: new Date(targetTime.getTime() - 5 * 60000), // 5 minutes before
      $lte: new Date(targetTime.getTime() + 5 * 60000)  // 5 minutes after
    },
    status: ConsultationStatus.SCHEDULED,
    [reminderField]: { $ne: true }
  });
};

// Instance methods
ConsultationSchema.methods.start = function() {
  this.status = ConsultationStatus.IN_PROGRESS;
  this.actualStartTime = new Date();
  return this.save();
};

ConsultationSchema.methods.complete = function(notes?: string) {
  this.status = ConsultationStatus.COMPLETED;
  this.actualEndTime = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

ConsultationSchema.methods.cancel = function(reason?: string) {
  this.status = ConsultationStatus.CANCELLED;
  if (reason && this.notes) {
    this.notes += `\nCancellation reason: ${reason}`;
  } else if (reason) {
    this.notes = `Cancellation reason: ${reason}`;
  }
  return this.save();
};

ConsultationSchema.methods.reschedule = function(newDate: Date, reason: string, rescheduledBy: string) {
  if (!this.rescheduleHistory) this.rescheduleHistory = [];
  
  this.rescheduleHistory.push({
    previousDate: this.scheduledDate,
    reason,
    rescheduledBy: new mongoose.Types.ObjectId(rescheduledBy),
    rescheduledAt: new Date()
  });
  
  this.scheduledDate = newDate;
  this.status = ConsultationStatus.SCHEDULED;
  
  // Reset reminders
  this.reminders = {
    sent24h: false,
    sent1h: false,
    sent15min: false
  };
  
  return this.save();
};

ConsultationSchema.methods.setReminder = function(type: '24h' | '1h' | '15min') {
  if (!this.reminders) this.reminders = {};
  
  switch (type) {
    case '24h':
      this.reminders.sent24h = true;
      break;
    case '1h':
      this.reminders.sent1h = true;
      break;
    case '15min':
      this.reminders.sent15min = true;
      break;
  }
  
  return this.save();
};

// Create and export the model
const Consultation: Model<IConsultation> = mongoose.models.Consultation || mongoose.model<IConsultation>('Consultation', ConsultationSchema);

export default Consultation;
