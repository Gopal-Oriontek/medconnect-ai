
import { Review, IReview, Severity } from '../models/Review';
import { Order, OrderStatus } from '../models/Order';
import { User } from '../models/User';
import { Notification, NotificationType } from '../models/Notification';
import { dbConnect } from '../connection';

export class ReviewService {
  
  static async createReview(reviewData: {
    orderId: string;
    reviewerId: string;
    title: string;
    content: string;
    recommendations?: string;
    severity?: Severity;
    reviewTime?: number;
    tags?: string[];
  }): Promise<IReview> {
    await dbConnect();
    
    // Verify order exists and reviewer is assigned
    const order = await Order.findById(reviewData.orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (!order.reviewerId || order.reviewerId.toString() !== reviewData.reviewerId) {
      throw new Error('Reviewer is not assigned to this order');
    }
    
    // Verify reviewer exists
    const reviewer = await User.findById(reviewData.reviewerId);
    if (!reviewer || !reviewer.isReviewer()) {
      throw new Error('Invalid reviewer');
    }
    
    const review = new Review(reviewData);
    const savedReview = await review.save();
    
    // Create notification for customer
    await Notification.create({
      userId: order.customerId,
      orderId: reviewData.orderId,
      title: 'Review Available',
      message: `Your medical review "${reviewData.title}" is now available`,
      type: NotificationType.REVIEW_COMPLETED
    });
    
    return savedReview;
  }
  
  static async getReviewById(id: string): Promise<IReview | null> {
    await dbConnect();
    
    return await Review.findById(id)
      .populate('orderId', 'orderNumber title customerId')
      .populate('reviewerId', 'name specialization licenseNumber');
  }
  
  static async getReviewsByOrder(orderId: string): Promise<IReview[]> {
    await dbConnect();
    
    return await Review.findByOrder(orderId)
      .populate('reviewerId', 'name specialization');
  }
  
  static async getReviewsByReviewer(
    reviewerId: string,
    options: {
      page?: number;
      limit?: number;
      isComplete?: boolean;
      severity?: Severity;
    } = {}
  ): Promise<{ reviews: IReview[]; total: number; pages: number }> {
    await dbConnect();
    
    const { page = 1, limit = 20, ...filters } = options;
    const skip = (page - 1) * limit;
    
    let query: any = { reviewerId, ...filters };
    
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('orderId', 'orderNumber title customerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query)
    ]);
    
    return {
      reviews,
      total,
      pages: Math.ceil(total / limit)
    };
  }
  
  static async updateReview(id: string, updates: Partial<IReview>): Promise<IReview | null> {
    await dbConnect();
    
    const review = await Review.findById(id);
    if (!review) {
      throw new Error('Review not found');
    }
    
    // Prevent updating certain fields
    const { _id, orderId, reviewerId, createdAt, ...safeUpdates } = updates;
    
    return await Review.findByIdAndUpdate(
      id,
      safeUpdates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'orderId', select: 'orderNumber title' },
      { path: 'reviewerId', select: 'name specialization' }
    ]);
  }
  
  static async completeReview(id: string, additionalData?: {
    recommendations?: string;
    attachments?: string[];
    ratings?: {
      clarity: number;
      accuracy: number;
      completeness: number;
    };
  }): Promise<IReview | null> {
    await dbConnect();
    
    const review = await Review.findById(id);
    if (!review) {
      throw new Error('Review not found');
    }
    
    if (review.isComplete) {
      throw new Error('Review is already completed');
    }
    
    // Update review data
    if (additionalData) {
      Object.assign(review, additionalData);
    }
    
    review.isComplete = true;
    const completedReview = await review.save();
    
    // Update order status to completed (this is handled in the Review model's post-save hook)
    
    return completedReview;
  }
  
  static async addReviewRating(id: string, ratings: {
    clarity: number;
    accuracy: number;
    completeness: number;
    overall?: number;
  }): Promise<IReview | null> {
    await dbConnect();
    
    // Validate ratings
    const validRatings = Object.entries(ratings).every(([key, value]) => {
      return typeof value === 'number' && value >= 1 && value <= 5;
    });
    
    if (!validRatings) {
      throw new Error('All ratings must be between 1 and 5');
    }
    
    return await Review.findByIdAndUpdate(
      id,
      { ratings },
      { new: true, runValidators: true }
    );
  }
  
  static async addReviewTags(id: string, tags: string[]): Promise<IReview | null> {
    await dbConnect();
    
    const review = await Review.findById(id);
    if (!review) {
      throw new Error('Review not found');
    }
    
    // Add tags one by one to handle duplicates
    for (const tag of tags) {
      await review.addTag(tag);
    }
    
    return review;
  }
  
  static async removeReviewTag(id: string, tag: string): Promise<IReview | null> {
    await dbConnect();
    
    const review = await Review.findById(id);
    if (!review) {
      throw new Error('Review not found');
    }
    
    await review.removeTag(tag);
    return review;
  }
  
  static async searchReviews(searchTerm: string, filters: {
    reviewerId?: string;
    severity?: Severity;
    isComplete?: boolean;
    tags?: string[];
  } = {}): Promise<IReview[]> {
    await dbConnect();
    
    let query: any = {
      ...filters,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
        { recommendations: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    
    return await Review.find(query)
      .populate([
        { path: 'orderId', select: 'orderNumber title' },
        { path: 'reviewerId', select: 'name specialization' }
      ])
      .sort({ createdAt: -1 })
      .limit(20);
  }
  
  static async getReviewStats(reviewerId?: string): Promise<any> {
    await dbConnect();
    
    return await Review.getReviewStats(reviewerId);
  }
  
  static async getReviewsBySeverity(severity: Severity): Promise<IReview[]> {
    await dbConnect();
    
    return await Review.findBySeverity(severity)
      .populate([
        { path: 'orderId', select: 'orderNumber title' },
        { path: 'reviewerId', select: 'name specialization' }
      ]);
  }
  
  static async getReviewsByTags(tags: string[]): Promise<IReview[]> {
    await dbConnect();
    
    return await Review.findByTags(tags)
      .populate([
        { path: 'orderId', select: 'orderNumber title' },
        { path: 'reviewerId', select: 'name specialization' }
      ]);
  }
  
  static async getCompletedReviews(options: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{ reviews: IReview[]; total: number; pages: number }> {
    await dbConnect();
    
    const { page = 1, limit = 20, startDate, endDate } = options;
    const skip = (page - 1) * limit;
    
    let query: any = { isComplete: true };
    
    if (startDate || endDate) {
      query.updatedAt = {};
      if (startDate) query.updatedAt.$gte = startDate;
      if (endDate) query.updatedAt.$lte = endDate;
    }
    
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate([
          { path: 'orderId', select: 'orderNumber title' },
          { path: 'reviewerId', select: 'name specialization' }
        ])
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query)
    ]);
    
    return {
      reviews,
      total,
      pages: Math.ceil(total / limit)
    };
  }
  
  static async addReviewAttachment(id: string, attachmentPath: string): Promise<IReview | null> {
    await dbConnect();
    
    const review = await Review.findById(id);
    if (!review) {
      throw new Error('Review not found');
    }
    
    await review.addAttachment(attachmentPath);
    return review;
  }
  
  static async getReviewMetrics(filters: {
    reviewerId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    await dbConnect();
    
    let matchQuery: any = {};
    
    if (filters.reviewerId) matchQuery.reviewerId = filters.reviewerId;
    
    if (filters.startDate || filters.endDate) {
      matchQuery.createdAt = {};
      if (filters.startDate) matchQuery.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchQuery.createdAt.$lte = filters.endDate;
    }
    
    return await Review.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          completedReviews: {
            $sum: { $cond: ['$isComplete', 1, 0] }
          },
          averageReviewTime: { $avg: '$reviewTime' },
          averageWordCount: {
            $avg: {
              $add: [
                { $size: { $split: ['$content', ' '] } },
                {
                  $size: {
                    $split: [{ $ifNull: ['$recommendations', ''] }, ' ']
                  }
                }
              ]
            }
          },
          averageRating: { $avg: '$ratings.overall' },
          severityDistribution: {
            $push: '$severity'
          },
          tagUsage: {
            $push: '$tags'
          }
        }
      }
    ]);
  }
  
  static async deleteReview(id: string): Promise<boolean> {
    await dbConnect();
    
    const review = await Review.findById(id);
    if (!review) {
      throw new Error('Review not found');
    }
    
    // Only allow deletion if review is not completed
    if (review.isComplete) {
      throw new Error('Cannot delete completed review');
    }
    
    await Review.findByIdAndDelete(id);
    return true;
  }
}
