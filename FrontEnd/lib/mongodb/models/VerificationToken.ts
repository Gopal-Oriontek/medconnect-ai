
import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for VerificationToken document (NextAuth.js compatibility)
export interface IVerificationToken extends Document {
  _id: string;
  identifier: string;
  token: string;
  expires: Date;
  type?: 'email_verification' | 'password_reset' | 'magic_link' | 'signup';
  attempts?: number;
  createdAt: Date;
  updatedAt: Date;
}

// VerificationToken Schema
const VerificationTokenSchema: Schema<IVerificationToken> = new Schema({
  identifier: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  expires: {
    type: Date,
    required: true,
    validate: {
      validator: function(date: Date) {
        return date > new Date();
      },
      message: 'Token expiry date must be in the future'
    }
  },
  type: {
    type: String,
    enum: ['email_verification', 'password_reset', 'magic_link', 'signup'],
    default: 'email_verification'
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 attempts
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      // Hide the actual token for security
      delete ret.token;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
VerificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });
VerificationTokenSchema.index({ token: 1 }, { unique: true });
VerificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 }); // TTL index
VerificationTokenSchema.index({ identifier: 1 });
VerificationTokenSchema.index({ type: 1 });

// Virtual for is expired
VerificationTokenSchema.virtual('isExpired').get(function() {
  return this.expires < new Date();
});

// Virtual for is max attempts reached
VerificationTokenSchema.virtual('isMaxAttemptsReached').get(function() {
  return this.attempts >= 5;
});

// Pre-save middleware
VerificationTokenSchema.pre('save', function(next) {
  // Check if max attempts reached
  if (this.attempts >= 5) {
    const error = new Error('Maximum verification attempts reached');
    error.name = 'MaxAttemptsError';
    return next(error);
  }
  
  next();
});

// Static methods
VerificationTokenSchema.statics.findByIdentifierAndToken = function(identifier: string, token: string) {
  return this.findOne({ 
    identifier: identifier.toLowerCase(), 
    token,
    expires: { $gt: new Date() }
  });
};

VerificationTokenSchema.statics.findByIdentifier = function(identifier: string) {
  return this.find({ 
    identifier: identifier.toLowerCase(),
    expires: { $gt: new Date() }
  });
};

VerificationTokenSchema.statics.findByType = function(type: string) {
  return this.find({ 
    type,
    expires: { $gt: new Date() }
  });
};

VerificationTokenSchema.statics.cleanExpired = function() {
  return this.deleteMany({ expires: { $lt: new Date() } });
};

VerificationTokenSchema.statics.createToken = function(identifier: string, type: string = 'email_verification', expiryHours: number = 24) {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  
  const expires = new Date();
  expires.setHours(expires.getHours() + expiryHours);
  
  return this.create({
    identifier: identifier.toLowerCase(),
    token,
    expires,
    type
  });
};

// Instance methods
VerificationTokenSchema.methods.verify = function() {
  if (this.isExpired) {
    throw new Error('Token has expired');
  }
  
  if (this.isMaxAttemptsReached) {
    throw new Error('Maximum verification attempts reached');
  }
  
  return true;
};

VerificationTokenSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

VerificationTokenSchema.methods.invalidate = function() {
  this.expires = new Date(); // Set to current time to expire immediately
  return this.save();
};

// Create and export the model
const VerificationToken: Model<IVerificationToken> = mongoose.models.VerificationToken || 
  mongoose.model<IVerificationToken>('VerificationToken', VerificationTokenSchema);

export default VerificationToken;
