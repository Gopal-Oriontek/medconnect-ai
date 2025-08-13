
import mongoose, { Schema, Document, Model } from 'mongoose';

// Enums
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  REVIEWER = 'REVIEWER',
  ADMIN = 'ADMIN'
}

// Interface for User document
export interface IUser extends Document {
  _id: string;
  name?: string;
  email: string;
  password?: string;
  emailVerified?: Date;
  image?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  specialization?: string;
  licenseNumber?: string;
  bio?: string;
  hourlyRate?: number;
  availableSlots?: any;
  createdAt: Date;
  updatedAt: Date;
}

// User Schema
const UserSchema: Schema<IUser> = new Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: 6
  },
  emailVerified: {
    type: Date,
    default: null
  },
  image: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER
  },
  isActive: {
    type: Boolean,
    default: true
  },
  specialization: {
    type: String,
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  hourlyRate: {
    type: Number,
    min: 0
  },
  availableSlots: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Never send password in JSON
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ specialization: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for orders as customer
UserSchema.virtual('customerOrders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'customerId'
});

// Virtual for orders as reviewer
UserSchema.virtual('reviewerOrders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'reviewerId'
});

// Virtual for reviews
UserSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'reviewerId'
});

// Virtual for customer consultations
UserSchema.virtual('customerConsultations', {
  ref: 'Consultation',
  localField: '_id',
  foreignField: 'customerId'
});

// Virtual for reviewer consultations
UserSchema.virtual('reviewerConsultations', {
  ref: 'Consultation',
  localField: '_id',
  foreignField: 'reviewerId'
});

// Virtual for notifications
UserSchema.virtual('notifications', {
  ref: 'Notification',
  localField: '_id',
  foreignField: 'userId'
});

// Virtual for uploaded documents
UserSchema.virtual('uploadedDocuments', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'uploadedBy'
});

// Pre-save middleware
UserSchema.pre('save', function(next) {
  // Add any pre-save logic here
  next();
});

// Static methods
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

UserSchema.statics.findReviewers = function() {
  return this.find({ role: UserRole.REVIEWER, isActive: true });
};

// Instance methods
UserSchema.methods.isReviewer = function() {
  return this.role === UserRole.REVIEWER;
};

UserSchema.methods.isCustomer = function() {
  return this.role === UserRole.CUSTOMER;
};

UserSchema.methods.isAdmin = function() {
  return this.role === UserRole.ADMIN;
};

// Create and export the model
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
