
import { Document, IDocument } from '../models/Document';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Notification, NotificationType } from '../models/Notification';
import { dbConnect } from '../connection';
import fs from 'fs/promises';
import path from 'path';

export class DocumentService {
  
  static async uploadDocument(documentData: {
    orderId: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    fileType: string;
    filePath: string;
    uploadedBy: string;
    metadata?: any;
  }): Promise<IDocument> {
    await dbConnect();
    
    // Verify order exists
    const order = await Order.findById(documentData.orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Verify uploader exists
    const uploader = await User.findById(documentData.uploadedBy);
    if (!uploader) {
      throw new Error('Uploader not found');
    }
    
    // Check file size limits
    if (documentData.fileSize > 50 * 1024 * 1024) { // 50MB
      throw new Error('File size exceeds 50MB limit');
    }
    
    const document = new Document(documentData);
    const savedDocument = await document.save();
    
    // Create notification for document upload
    const notificationRecipients = [order.customerId];
    if (order.reviewerId && order.reviewerId.toString() !== documentData.uploadedBy) {
      notificationRecipients.push(order.reviewerId);
    }
    
    const notifications = notificationRecipients.map(userId => ({
      userId,
      orderId: documentData.orderId,
      title: 'Document Uploaded',
      message: `New document "${documentData.originalName}" has been uploaded`,
      type: NotificationType.DOCUMENT_UPLOADED
    }));
    
    await Notification.insertMany(notifications);
    
    return savedDocument;
  }
  
  static async getDocumentById(id: string): Promise<IDocument | null> {
    await dbConnect();
    
    return await Document.findById(id)
      .populate('orderId', 'orderNumber title customerId reviewerId')
      .populate('uploadedBy', 'name email');
  }
  
  static async getDocumentsByOrder(orderId: string): Promise<IDocument[]> {
    await dbConnect();
    
    return await Document.findByOrder(orderId)
      .populate('uploadedBy', 'name email role');
  }
  
  static async getDocumentsByUploader(uploadedBy: string, options: {
    page?: number;
    limit?: number;
    fileType?: string;
  } = {}): Promise<{ documents: IDocument[]; total: number; pages: number }> {
    await dbConnect();
    
    const { page = 1, limit = 20, fileType } = options;
    const skip = (page - 1) * limit;
    
    let query: any = { uploadedBy, isActive: true };
    
    if (fileType) {
      query.fileType = fileType;
    }
    
    const [documents, total] = await Promise.all([
      Document.find(query)
        .populate('orderId', 'orderNumber title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Document.countDocuments(query)
    ]);
    
    return {
      documents,
      total,
      pages: Math.ceil(total / limit)
    };
  }
  
  static async downloadDocument(id: string, userId: string): Promise<{
    document: IDocument;
    filePath: string;
  }> {
    await dbConnect();
    
    const document = await Document.findById(id)
      .populate('orderId', 'customerId reviewerId');
    
    if (!document || !document.isActive) {
      throw new Error('Document not found or inactive');
    }
    
    const order = document.orderId as any;
    
    // Check permissions
    if (
      order.customerId.toString() !== userId &&
      (order.reviewerId && order.reviewerId.toString() !== userId)
    ) {
      throw new Error('Unauthorized to download this document');
    }
    
    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch (error) {
      throw new Error('File not found on server');
    }
    
    // Increment download count
    await document.incrementDownloadCount();
    
    return {
      document,
      filePath: document.filePath
    };
  }
  
  static async deleteDocument(id: string, userId: string): Promise<boolean> {
    await dbConnect();
    
    const document = await Document.findById(id)
      .populate('orderId', 'customerId reviewerId');
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    const order = document.orderId as any;
    
    // Check permissions - only uploader, customer, or reviewer can delete
    if (
      document.uploadedBy.toString() !== userId &&
      order.customerId.toString() !== userId &&
      (order.reviewerId && order.reviewerId.toString() !== userId)
    ) {
      throw new Error('Unauthorized to delete this document');
    }
    
    // Soft delete
    await document.softDelete();
    
    // Optionally delete the physical file
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.warn('Could not delete physical file:', error);
    }
    
    return true;
  }
  
  static async restoreDocument(id: string): Promise<boolean> {
    await dbConnect();
    
    const document = await Document.findById(id);
    if (!document) {
      throw new Error('Document not found');
    }
    
    await document.restore();
    return true;
  }
  
  static async searchDocuments(searchTerm: string, filters: {
    orderId?: string;
    uploadedBy?: string;
    fileType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<IDocument[]> {
    await dbConnect();
    
    let query: any = {
      ...filters,
      isActive: true,
      $or: [
        { originalName: { $regex: searchTerm, $options: 'i' } },
        { fileName: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }
    
    return await Document.find(query)
      .populate('orderId', 'orderNumber title')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);
  }
  
  static async getDocumentStats(filters: {
    orderId?: string;
    uploadedBy?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    await dbConnect();
    
    let matchQuery: any = { isActive: true };
    
    if (filters.orderId) matchQuery.orderId = filters.orderId;
    if (filters.uploadedBy) matchQuery.uploadedBy = filters.uploadedBy;
    
    if (filters.startDate || filters.endDate) {
      matchQuery.createdAt = {};
      if (filters.startDate) matchQuery.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchQuery.createdAt.$lte = filters.endDate;
    }
    
    return await Document.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
          totalDownloads: { $sum: '$downloadCount' },
          averageSize: { $avg: '$fileSize' },
          fileTypeBreakdown: {
            $push: '$fileType'
          },
          largestFile: { $max: '$fileSize' },
          smallestFile: { $min: '$fileSize' }
        }
      }
    ]);
  }
  
  static async getDocumentsByType(fileType: string, orderId?: string): Promise<IDocument[]> {
    await dbConnect();
    
    const query: any = { fileType, isActive: true };
    if (orderId) query.orderId = orderId;
    
    return await Document.find(query)
      .populate('orderId', 'orderNumber title')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
  }
  
  static async getImages(orderId?: string): Promise<IDocument[]> {
    await dbConnect();
    
    return await Document.findImages(orderId)
      .populate('orderId', 'orderNumber title')
      .populate('uploadedBy', 'name email');
  }
  
  static async getPDFs(orderId?: string): Promise<IDocument[]> {
    await dbConnect();
    
    return await Document.findPDFs(orderId)
      .populate('orderId', 'orderNumber title')
      .populate('uploadedBy', 'name email');
  }
  
  static async updateDocumentMetadata(id: string, metadata: any): Promise<IDocument | null> {
    await dbConnect();
    
    return await Document.findByIdAndUpdate(
      id,
      { metadata },
      { new: true, runValidators: true }
    );
  }
  
  static async cleanupInactiveDocuments(daysOld: number = 30): Promise<number> {
    await dbConnect();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const inactiveDocuments = await Document.find({
      isActive: false,
      updatedAt: { $lt: cutoffDate }
    });
    
    // Delete physical files
    for (const doc of inactiveDocuments) {
      try {
        await fs.unlink(doc.filePath);
      } catch (error) {
        console.warn(`Could not delete file ${doc.filePath}:`, error);
      }
    }
    
    // Delete from database
    const result = await Document.deleteMany({
      isActive: false,
      updatedAt: { $lt: cutoffDate }
    });
    
    return result.deletedCount || 0;
  }
  
  static async validateFileUpload(file: {
    size: number;
    mimetype: string;
    originalname: string;
  }): Promise<boolean> {
    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('File size exceeds 50MB limit');
    }
    
    // Check file type
    const allowedTypes = [
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
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('File type not supported');
    }
    
    // Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.doc', '.docx', '.txt', '.rtf'];
    
    if (!allowedExtensions.includes(extension)) {
      throw new Error('File extension not supported');
    }
    
    return true;
  }
}
