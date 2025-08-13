
import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for Session document (NextAuth.js compatibility)
export interface ISession extends Document {
  _id: string;
  sessionToken: string;
  userId: Schema.Types.ObjectId;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Session Schema
const SessionSchema: Schema<ISession> = new Schema({
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expires: {
    type: Date,
    required: true,
    validate: {
      validator: function(date: Date) {
        return date > new Date();
      },
      message: 'Session expiry date must be in the future'
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
SessionSchema.index({ sessionToken: 1 }, { unique: true });
SessionSchema.index({ userId: 1 });
SessionSchema.index({ expires: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for user
SessionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for is expired
SessionSchema.virtual('isExpired').get(function() {
  return this.expires < new Date();
});

// Static methods
SessionSchema.statics.findByToken = function(sessionToken: string) {
  return this.findOne({ sessionToken });
};

SessionSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId });
};

SessionSchema.statics.findActive = function() {
  return this.find({ expires: { $gt: new Date() } });
};

SessionSchema.statics.cleanExpired = function() {
  return this.deleteMany({ expires: { $lt: new Date() } });
};

// Instance methods
SessionSchema.methods.extend = function(days: number = 30) {
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + days);
  this.expires = newExpiry;
  return this.save();
};

// Create and export the model
const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default Session;
