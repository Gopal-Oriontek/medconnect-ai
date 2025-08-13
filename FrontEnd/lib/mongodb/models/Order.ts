
import mongoose, { Schema, Document, Model } from 'mongoose';

// Enums
export enum ProductType {
  SECOND_OPINION = 'SECOND_OPINION',
  CONSULTATION = 'CONSULTATION',
  DOCUMENT_REVIEW = 'DOCUMENT_REVIEW',
  EXPERT_ANALYSIS = 'EXPERT_ANALYSIS'
}

export enum OrderStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Interface for Order document
export interface IOrder extends Document {
  _id: string;
  orderNumber: string;
  customerId: Schema.Types.ObjectId;
  reviewerId?: Schema.Types.ObjectId;
  productType: ProductType;
  title: string;
  description?: string;
  status: OrderStatus;
  priority: Priority;
  totalAmount: number;
  paidAmount: number;
  dueDate?: Date;
  assignedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Order Schema
const OrderSchema: Schema<IOrder> = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  productType: {
    type: String,
    enum: Object.values(ProductType),
    default: ProductType.SECOND_OPINION
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING_REVIEW
  },
  priority: {
    type: String,
    enum: Object.values(Priority),
    default: Priority.MEDIUM
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date,
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
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
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ reviewerId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ priority: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ dueDate: 1 });

// Compound indexes
OrderSchema.index({ status: 1, priority: -1 });
OrderSchema.index({ customerId: 1, status: 1 });
OrderSchema.index({ reviewerId: 1, status: 1 });

// Virtual for customer
OrderSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for reviewer
OrderSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for documents
OrderSchema.virtual('documents', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'orderId'
});

// Virtual for reviews
OrderSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'orderId'
});

// Virtual for payments
OrderSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'orderId'
});

// Virtual for consultations
OrderSchema.virtual('consultations', {
  ref: 'Consultation',
  localField: '_id',
  foreignField: 'orderId'
});

// Virtual for notifications
OrderSchema.virtual('notifications', {
  ref: 'Notification',
  localField: '_id',
  foreignField: 'orderId'
});

// Virtual for payment status
OrderSchema.virtual('paymentStatus').get(function() {
  return this.paidAmount >= this.totalAmount ? 'PAID' : 
         this.paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
});

// Pre-save middleware
OrderSchema.pre('save', function(next) {
  // Generate order number if not exists
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  
  // Set assignedAt when reviewer is assigned
  if (this.reviewerId && !this.assignedAt) {
    this.assignedAt = new Date();
  }
  
  // Set completedAt when status is completed
  if (this.status === OrderStatus.COMPLETED && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Static methods
OrderSchema.statics.findByOrderNumber = function(orderNumber: string) {
  return this.findOne({ orderNumber });
};

OrderSchema.statics.findByCustomer = function(customerId: string) {
  return this.find({ customerId }).sort({ createdAt: -1 });
};

OrderSchema.statics.findByReviewer = function(reviewerId: string) {
  return this.find({ reviewerId }).sort({ createdAt: -1 });
};

OrderSchema.statics.findPendingOrders = function() {
  return this.find({ status: OrderStatus.PENDING_REVIEW }).sort({ priority: -1, createdAt: 1 });
};

OrderSchema.statics.findOverdueOrders = function() {
  return this.find({ 
    dueDate: { $lt: new Date() },
    status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED] }
  });
};

// Instance methods
OrderSchema.methods.canBeAssigned = function() {
  return this.status === OrderStatus.PENDING_REVIEW;
};

OrderSchema.methods.canBeStarted = function() {
  return this.status === OrderStatus.ASSIGNED;
};

OrderSchema.methods.canBeCompleted = function() {
  return this.status === OrderStatus.IN_PROGRESS || this.status === OrderStatus.UNDER_REVIEW;
};

OrderSchema.methods.isOverdue = function() {
  return this.dueDate && this.dueDate < new Date() && 
         ![OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(this.status);
};

// Create and export the model
const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
