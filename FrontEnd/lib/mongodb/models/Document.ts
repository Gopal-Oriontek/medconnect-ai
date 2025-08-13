
import mongoose, { Schema, Document as MongoDocument, Model } from 'mongoose';

// Interface for Document
export interface IDocument extends MongoDocument {
  _id: string;
  orderId: Schema.Types.ObjectId;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  uploadedBy: Schema.Types.ObjectId;
  isActive: boolean;
  downloadCount: number;
  metadata?: {
    width?: number;
    height?: number;
    pages?: number;
    duration?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Document Schema
const DocumentSchema: Schema<IDocument> = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: Number,
    required: true,
    min: 0,
    max: 50 * 1024 * 1024 // 50MB max
  },
  fileType: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    enum: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf'
    ]
  },
  filePath: {
    type: String,
    required: true,
    trim: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  metadata: {
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
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
DocumentSchema.index({ orderId: 1 });
DocumentSchema.index({ uploadedBy: 1 });
DocumentSchema.index({ isActive: 1 });
DocumentSchema.index({ fileType: 1 });
DocumentSchema.index({ createdAt: -1 });

// Compound indexes
DocumentSchema.index({ orderId: 1, isActive: 1 });
DocumentSchema.index({ uploadedBy: 1, createdAt: -1 });

// Virtual for order
DocumentSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for uploader
DocumentSchema.virtual('uploader', {
  ref: 'User',
  localField: 'uploadedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for file size in human readable format
DocumentSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for file extension
DocumentSchema.virtual('fileExtension').get(function() {
  return this.originalName.split('.').pop()?.toLowerCase() || '';
});

// Virtual for is image
DocumentSchema.virtual('isImage').get(function() {
  return this.fileType.startsWith('image/');
});

// Virtual for is PDF
DocumentSchema.virtual('isPDF').get(function() {
  return this.fileType === 'application/pdf';
});

// Virtual for is document
DocumentSchema.virtual('isDocument').get(function() {
  return this.fileType.includes('word') || 
         this.fileType === 'text/plain' || 
         this.fileType === 'application/rtf';
});

// Pre-save middleware
DocumentSchema.pre('save', function(next) {
  // Validate file size
  if (this.fileSize > 50 * 1024 * 1024) {
    next(new Error('File size cannot exceed 50MB'));
    return;
  }
  
  next();
});

// Static methods
DocumentSchema.statics.findByOrder = function(orderId: string) {
  return this.find({ orderId, isActive: true }).sort({ createdAt: -1 });
};

DocumentSchema.statics.findByUploader = function(uploadedBy: string) {
  return this.find({ uploadedBy, isActive: true }).sort({ createdAt: -1 });
};

DocumentSchema.statics.findByFileType = function(fileType: string) {
  return this.find({ fileType, isActive: true }).sort({ createdAt: -1 });
};

DocumentSchema.statics.findImages = function(orderId?: string) {
  const query: any = { 
    fileType: { $regex: '^image/', $options: 'i' },
    isActive: true
  };
  if (orderId) query.orderId = orderId;
  return this.find(query).sort({ createdAt: -1 });
};

DocumentSchema.statics.findPDFs = function(orderId?: string) {
  const query: any = { 
    fileType: 'application/pdf',
    isActive: true
  };
  if (orderId) query.orderId = orderId;
  return this.find(query).sort({ createdAt: -1 });
};

DocumentSchema.statics.getTotalSize = function(orderId?: string) {
  const matchQuery: any = { isActive: true };
  if (orderId) matchQuery.orderId = new mongoose.Types.ObjectId(orderId);
  
  return this.aggregate([
    { $match: matchQuery },
    { $group: { _id: null, totalSize: { $sum: '$fileSize' }, count: { $sum: 1 } } }
  ]);
};

// Instance methods
DocumentSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

DocumentSchema.methods.softDelete = function() {
  this.isActive = false;
  return this.save();
};

DocumentSchema.methods.restore = function() {
  this.isActive = true;
  return this.save();
};

// Create and export the model
const Document: Model<IDocument> = mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);

export default Document;
