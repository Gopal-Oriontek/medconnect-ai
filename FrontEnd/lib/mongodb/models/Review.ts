
import mongoose, { Schema, Document, Model } from 'mongoose';

// Enums
export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Interface for Review document
export interface IReview extends Document {
  _id: string;
  orderId: Schema.Types.ObjectId;
  reviewerId: Schema.Types.ObjectId;
  title: string;
  content: string;
  recommendations?: string;
  severity: Severity;
  isComplete: boolean;
  reviewTime?: number; // Time spent in minutes
  attachments?: string[];
  tags?: string[];
  ratings?: {
    clarity: number;
    accuracy: number;
    completeness: number;
    overall: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Review Schema
const ReviewSchema: Schema<IReview> = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000
  },
  recommendations: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  severity: {
    type: String,
    enum: Object.values(Severity),
    default: Severity.MEDIUM
  },
  isComplete: {
    type: Boolean,
    default: false
  },
  reviewTime: {
    type: Number,
    min: 0,
    max: 1440 // Max 24 hours
  },
  attachments: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  ratings: {
    clarity: {
      type: Number,
      min: 1,
      max: 5
    },
    accuracy: {
      type: Number,
      min: 1,
      max: 5
    },
    completeness: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
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
ReviewSchema.index({ orderId: 1 });
ReviewSchema.index({ reviewerId: 1 });
ReviewSchema.index({ isComplete: 1 });
ReviewSchema.index({ severity: 1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ tags: 1 });

// Compound indexes
ReviewSchema.index({ reviewerId: 1, isComplete: 1 });
ReviewSchema.index({ orderId: 1, isComplete: 1 });
ReviewSchema.index({ severity: 1, createdAt: -1 });

// Virtual for order
ReviewSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for reviewer
ReviewSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for word count
ReviewSchema.virtual('wordCount').get(function() {
  const content = this.content + ' ' + (this.recommendations || '');
  return content.trim().split(/\s+/).length;
});

// Virtual for reading time (average 200 words per minute)
ReviewSchema.virtual('readingTime').get(function() {
  return Math.ceil(this.wordCount / 200);
});

// Virtual for average rating
ReviewSchema.virtual('averageRating').get(function() {
  if (!this.ratings) return null;
  
  const ratings = Object.values(this.ratings).filter(r => typeof r === 'number');
  if (ratings.length === 0) return null;
  
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Virtual for review time formatted
ReviewSchema.virtual('reviewTimeFormatted').get(function() {
  if (!this.reviewTime) return null;
  
  const hours = Math.floor(this.reviewTime / 60);
  const minutes = this.reviewTime % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Pre-save middleware
ReviewSchema.pre('save', function(next) {
  // Auto-calculate overall rating if individual ratings are provided
  if (this.ratings && !this.ratings.overall) {
    const { clarity, accuracy, completeness } = this.ratings;
    if (clarity && accuracy && completeness) {
      this.ratings.overall = Math.round((clarity + accuracy + completeness) / 3 * 10) / 10;
    }
  }
  
  // Clean up tags
  if (this.tags && this.tags.length > 0) {
    this.tags = this.tags
      .filter(tag => tag && tag.trim().length > 0)
      .map(tag => tag.trim().toLowerCase())
      .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
  }
  
  next();
});

// Post-save middleware
ReviewSchema.post('save', async function(doc) {
  // Update order status when review is completed
  if (doc.isComplete) {
    const Order = mongoose.model('Order');
    await Order.findByIdAndUpdate(doc.orderId, { 
      status: 'COMPLETED',
      completedAt: new Date()
    });
  }
});

// Static methods
ReviewSchema.statics.findByOrder = function(orderId: string) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

ReviewSchema.statics.findByReviewer = function(reviewerId: string) {
  return this.find({ reviewerId }).sort({ createdAt: -1 });
};

ReviewSchema.statics.findCompleted = function() {
  return this.find({ isComplete: true }).sort({ createdAt: -1 });
};

ReviewSchema.statics.findBySeverity = function(severity: Severity) {
  return this.find({ severity }).sort({ createdAt: -1 });
};

ReviewSchema.statics.findByTags = function(tags: string[]) {
  return this.find({ tags: { $in: tags } }).sort({ createdAt: -1 });
};

ReviewSchema.statics.getReviewStats = function(reviewerId?: string) {
  const matchQuery: any = {};
  if (reviewerId) matchQuery.reviewerId = new mongoose.Types.ObjectId(reviewerId);
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        completedReviews: { $sum: { $cond: ['$isComplete', 1, 0] } },
        averageReviewTime: { $avg: '$reviewTime' },
        averageRating: { $avg: '$ratings.overall' },
        severityBreakdown: {
          $push: '$severity'
        }
      }
    }
  ]);
};

// Instance methods
ReviewSchema.methods.complete = function() {
  this.isComplete = true;
  return this.save();
};

ReviewSchema.methods.addTag = function(tag: string) {
  if (!this.tags) this.tags = [];
  const cleanTag = tag.trim().toLowerCase();
  if (cleanTag && !this.tags.includes(cleanTag)) {
    this.tags.push(cleanTag);
  }
  return this.save();
};

ReviewSchema.methods.removeTag = function(tag: string) {
  if (!this.tags) return this.save();
  this.tags = this.tags.filter(t => t !== tag.trim().toLowerCase());
  return this.save();
};

ReviewSchema.methods.addAttachment = function(attachmentPath: string) {
  if (!this.attachments) this.attachments = [];
  if (!this.attachments.includes(attachmentPath)) {
    this.attachments.push(attachmentPath);
  }
  return this.save();
};

// Create and export the model
const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
