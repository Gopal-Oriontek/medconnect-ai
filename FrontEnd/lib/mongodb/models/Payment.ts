
import mongoose, { Schema, Document, Model } from 'mongoose';

// Enums
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET'
}

// Interface for Payment document
export interface IPayment extends Document {
  _id: string;
  orderId: Schema.Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentProvider?: string;
  transactionId?: string;
  stripePaymentId?: string;
  paypalPaymentId?: string;
  bankReference?: string;
  cardLast4?: string;
  cardBrand?: string;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  fee?: number;
  netAmount?: number;
  metadata?: {
    customerIp?: string;
    userAgent?: string;
    billingAddress?: any;
    [key: string]: any;
  };
  processedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Schema
const PaymentSchema: Schema<IPayment> = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(amount: number) {
        return amount > 0;
      },
      message: 'Payment amount must be greater than 0'
    }
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true,
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR']
  },
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: true
  },
  paymentProvider: {
    type: String,
    trim: true,
    lowercase: true
  },
  transactionId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allows multiple null values
  },
  stripePaymentId: {
    type: String,
    trim: true,
    sparse: true
  },
  paypalPaymentId: {
    type: String,
    trim: true,
    sparse: true
  },
  bankReference: {
    type: String,
    trim: true
  },
  cardLast4: {
    type: String,
    trim: true,
    match: [/^\d{4}$/, 'Card last 4 digits must be exactly 4 numbers']
  },
  cardBrand: {
    type: String,
    trim: true,
    lowercase: true,
    enum: ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay']
  },
  failureReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  refundId: {
    type: String,
    trim: true
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  refundReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  fee: {
    type: Number,
    min: 0,
    default: 0
  },
  netAmount: {
    type: Number,
    min: 0
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  processedAt: {
    type: Date,
    default: null
  },
  refundedAt: {
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
      // Hide sensitive information
      delete ret.stripePaymentId;
      delete ret.paypalPaymentId;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ stripePaymentId: 1 }, { sparse: true });
PaymentSchema.index({ paypalPaymentId: 1 }, { sparse: true });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ processedAt: -1 });

// Compound indexes
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ paymentMethod: 1, status: 1 });
PaymentSchema.index({ orderId: 1, status: 1 });

// Virtual for order
PaymentSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for is successful
PaymentSchema.virtual('isSuccessful').get(function() {
  return this.status === PaymentStatus.COMPLETED;
});

// Virtual for is refundable
PaymentSchema.virtual('isRefundable').get(function() {
  return this.status === PaymentStatus.COMPLETED && !this.refundId;
});

// Virtual for formatted amount
PaymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Virtual for masked card number
PaymentSchema.virtual('maskedCard').get(function() {
  if (!this.cardLast4) return null;
  return `**** **** **** ${this.cardLast4}`;
});

// Pre-save middleware
PaymentSchema.pre('save', function(next) {
  // Calculate net amount if fee is provided
  if (this.fee && !this.netAmount) {
    this.netAmount = this.amount - this.fee;
  } else if (!this.netAmount) {
    this.netAmount = this.amount;
  }
  
  // Set processedAt when status changes to completed
  if (this.status === PaymentStatus.COMPLETED && !this.processedAt) {
    this.processedAt = new Date();
  }
  
  // Set refundedAt when status changes to refunded
  if (this.status === PaymentStatus.REFUNDED && !this.refundedAt) {
    this.refundedAt = new Date();
  }
  
  // Generate transaction ID if not provided
  if (!this.transactionId && this.status !== PaymentStatus.PENDING) {
    this.transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  next();
});

// Post-save middleware
PaymentSchema.post('save', async function(doc) {
  // Update order when payment is completed
  if (doc.status === PaymentStatus.COMPLETED) {
    const Order = mongoose.model('Order');
    await Order.findByIdAndUpdate(doc.orderId, { 
      $inc: { paidAmount: doc.amount }
    });
    
    // Create notification
    const Notification = mongoose.model('Notification');
    const order = await Order.findById(doc.orderId).populate('customerId');
    if (order) {
      await Notification.create({
        userId: order.customerId,
        orderId: doc.orderId,
        title: 'Payment Received',
        message: `Payment of ${doc.formattedAmount} has been processed successfully`,
        type: 'PAYMENT_RECEIVED'
      });
    }
  }
  
  // Handle failed payment
  if (doc.status === PaymentStatus.FAILED) {
    const Notification = mongoose.model('Notification');
    const Order = mongoose.model('Order');
    const order = await Order.findById(doc.orderId).populate('customerId');
    if (order) {
      await Notification.create({
        userId: order.customerId,
        orderId: doc.orderId,
        title: 'Payment Failed',
        message: `Payment of ${doc.formattedAmount} failed. Please try again.`,
        type: 'PAYMENT_FAILED'
      });
    }
  }
});

// Static methods
PaymentSchema.statics.findByOrder = function(orderId: string) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

PaymentSchema.statics.findSuccessful = function() {
  return this.find({ status: PaymentStatus.COMPLETED }).sort({ createdAt: -1 });
};

PaymentSchema.statics.findFailed = function() {
  return this.find({ status: PaymentStatus.FAILED }).sort({ createdAt: -1 });
};

PaymentSchema.statics.findPending = function() {
  return this.find({ status: PaymentStatus.PENDING }).sort({ createdAt: 1 });
};

PaymentSchema.statics.findByTransactionId = function(transactionId: string) {
  return this.findOne({ transactionId });
};

PaymentSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

PaymentSchema.statics.getPaymentStats = function(dateRange?: { start: Date; end: Date }) {
  const matchQuery: any = {};
  if (dateRange) {
    matchQuery.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalFees: { $sum: '$fee' },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        },
        refundedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'REFUNDED'] }, 1, 0] }
        },
        averageAmount: { $avg: '$amount' },
        paymentMethodBreakdown: {
          $push: '$paymentMethod'
        }
      }
    }
  ]);
};

// Instance methods
PaymentSchema.methods.complete = function(transactionId?: string) {
  this.status = PaymentStatus.COMPLETED;
  this.processedAt = new Date();
  if (transactionId) this.transactionId = transactionId;
  return this.save();
};

PaymentSchema.methods.fail = function(reason?: string) {
  this.status = PaymentStatus.FAILED;
  if (reason) this.failureReason = reason;
  return this.save();
};

PaymentSchema.methods.refund = function(amount?: number, reason?: string, refundId?: string) {
  this.status = PaymentStatus.REFUNDED;
  this.refundAmount = amount || this.amount;
  this.refundReason = reason;
  this.refundId = refundId;
  this.refundedAt = new Date();
  return this.save();
};

PaymentSchema.methods.cancel = function() {
  if (this.status === PaymentStatus.PENDING) {
    this.status = PaymentStatus.CANCELLED;
    return this.save();
  }
  throw new Error('Can only cancel pending payments');
};

// Create and export the model
const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
