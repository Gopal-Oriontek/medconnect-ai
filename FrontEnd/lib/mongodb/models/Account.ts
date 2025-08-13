
import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for Account document (NextAuth.js compatibility)
export interface IAccount extends Document {
  _id: string;
  userId: Schema.Types.ObjectId;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
  oauth_token_secret?: string;
  oauth_token?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Account Schema
const AccountSchema: Schema<IAccount> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['oauth', 'email', 'credentials']
  },
  provider: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  providerAccountId: {
    type: String,
    required: true,
    trim: true
  },
  refresh_token: {
    type: String,
    trim: true
  },
  access_token: {
    type: String,
    trim: true
  },
  expires_at: {
    type: Number
  },
  token_type: {
    type: String,
    trim: true
  },
  scope: {
    type: String,
    trim: true
  },
  id_token: {
    type: String,
    trim: true
  },
  session_state: {
    type: String,
    trim: true
  },
  oauth_token_secret: {
    type: String,
    trim: true
  },
  oauth_token: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      // Hide sensitive tokens
      delete ret.refresh_token;
      delete ret.access_token;
      delete ret.id_token;
      delete ret.oauth_token;
      delete ret.oauth_token_secret;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
AccountSchema.index({ userId: 1 });
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
AccountSchema.index({ provider: 1 });

// Virtual for user
AccountSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Static methods
AccountSchema.statics.findByProvider = function(provider: string) {
  return this.find({ provider });
};

AccountSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId });
};

AccountSchema.statics.findByProviderAccount = function(provider: string, providerAccountId: string) {
  return this.findOne({ provider, providerAccountId });
};

// Create and export the model
const Account: Model<IAccount> = mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);

export default Account;
