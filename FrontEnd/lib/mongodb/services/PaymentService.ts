
import { Payment, IPayment, PaymentStatus, PaymentMethod } from '../models/Payment';
import { Order } from '../models/Order';
import { Notification, NotificationType } from '../models/Notification';
import { dbConnect } from '../connection';

export class PaymentService {
  
  static async createPayment(paymentData: {
    orderId: string;
    amount: number;
    currency?: string;
    paymentMethod: PaymentMethod;
    paymentProvider?: string;
    metadata?: any;
  }): Promise<IPayment> {
    await dbConnect();
    
    // Verify order exists
    const order = await Order.findById(paymentData.orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Check if payment amount is valid
    if (paymentData.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }
    
    const payment = new Payment({
      ...paymentData,
      currency: paymentData.currency || 'USD'
    });
    
    return await payment.save();
  }
  
  static async getPaymentById(id: string): Promise<IPayment | null> {
    await dbConnect();
    
    return await Payment.findById(id)
      .populate('orderId', 'orderNumber title customerId totalAmount');
  }
  
  static async getPaymentsByOrder(orderId: string): Promise<IPayment[]> {
    await dbConnect();
    
    return await Payment.findByOrder(orderId)
      .sort({ createdAt: -1 });
  }
  
  static async getPaymentByTransactionId(transactionId: string): Promise<IPayment | null> {
    await dbConnect();
    
    return await Payment.findByTransactionId(transactionId)
      .populate('orderId', 'orderNumber title customerId');
  }
  
  static async completePayment(
    id: string,
    data: {
      transactionId?: string;
      cardLast4?: string;
      cardBrand?: string;
      fee?: number;
      stripePaymentId?: string;
      paypalPaymentId?: string;
    }
  ): Promise<IPayment | null> {
    await dbConnect();
    
    const payment = await Payment.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new Error('Payment is already completed');
    }
    
    // Update payment data
    Object.assign(payment, data);
    
    await payment.complete(data.transactionId);
    
    return payment;
  }
  
  static async failPayment(id: string, reason?: string): Promise<IPayment | null> {
    await dbConnect();
    
    const payment = await Payment.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    if (payment.status === PaymentStatus.FAILED) {
      throw new Error('Payment is already marked as failed');
    }
    
    await payment.fail(reason);
    
    return payment;
  }
  
  static async refundPayment(
    id: string,
    refundData: {
      amount?: number;
      reason?: string;
      refundId?: string;
    }
  ): Promise<IPayment | null> {
    await dbConnect();
    
    const payment = await Payment.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Only completed payments can be refunded');
    }
    
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new Error('Payment is already refunded');
    }
    
    const refundAmount = refundData.amount || payment.amount;
    
    if (refundAmount > payment.amount) {
      throw new Error('Refund amount cannot exceed original payment amount');
    }
    
    await payment.refund(refundAmount, refundData.reason, refundData.refundId);
    
    // Update order paid amount
    const order = await Order.findById(payment.orderId);
    if (order) {
      order.paidAmount = Math.max(0, order.paidAmount - refundAmount);
      await order.save();
      
      // Create notification
      await Notification.create({
        userId: order.customerId,
        orderId: order._id,
        title: 'Payment Refunded',
        message: `A refund of ${payment.formattedAmount} has been processed`,
        type: NotificationType.PAYMENT_RECEIVED
      });
    }
    
    return payment;
  }
  
  static async cancelPayment(id: string): Promise<IPayment | null> {
    await dbConnect();
    
    const payment = await Payment.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    await payment.cancel();
    
    return payment;
  }
  
  static async getSuccessfulPayments(options: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{ payments: IPayment[]; total: number; pages: number }> {
    await dbConnect();
    
    const { page = 1, limit = 20, startDate, endDate } = options;
    const skip = (page - 1) * limit;
    
    let query: any = { status: PaymentStatus.COMPLETED };
    
    if (startDate || endDate) {
      query.processedAt = {};
      if (startDate) query.processedAt.$gte = startDate;
      if (endDate) query.processedAt.$lte = endDate;
    }
    
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('orderId', 'orderNumber title customerId')
        .sort({ processedAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query)
    ]);
    
    return {
      payments,
      total,
      pages: Math.ceil(total / limit)
    };
  }
  
  static async getFailedPayments(): Promise<IPayment[]> {
    await dbConnect();
    
    return await Payment.findFailed()
      .populate('orderId', 'orderNumber title customerId');
  }
  
  static async getPendingPayments(): Promise<IPayment[]> {
    await dbConnect();
    
    return await Payment.findPending()
      .populate('orderId', 'orderNumber title customerId');
  }
  
  static async getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<IPayment[]> {
    await dbConnect();
    
    return await Payment.findByDateRange(startDate, endDate)
      .populate('orderId', 'orderNumber title customerId');
  }
  
  static async getPaymentStats(dateRange?: { start: Date; end: Date }): Promise<any> {
    await dbConnect();
    
    return await Payment.getPaymentStats(dateRange);
  }
  
  static async processStripePayment(
    paymentId: string,
    stripeData: {
      paymentIntentId: string;
      chargeId: string;
      cardLast4: string;
      cardBrand: string;
      fee: number;
    }
  ): Promise<IPayment | null> {
    await dbConnect();
    
    return await this.completePayment(paymentId, {
      transactionId: stripeData.chargeId,
      stripePaymentId: stripeData.paymentIntentId,
      cardLast4: stripeData.cardLast4,
      cardBrand: stripeData.cardBrand,
      fee: stripeData.fee
    });
  }
  
  static async processPayPalPayment(
    paymentId: string,
    paypalData: {
      paymentId: string;
      transactionId: string;
      fee: number;
    }
  ): Promise<IPayment | null> {
    await dbConnect();
    
    return await this.completePayment(paymentId, {
      transactionId: paypalData.transactionId,
      paypalPaymentId: paypalData.paymentId,
      fee: paypalData.fee
    });
  }
  
  static async updatePaymentMetadata(id: string, metadata: any): Promise<IPayment | null> {
    await dbConnect();
    
    return await Payment.findByIdAndUpdate(
      id,
      { metadata },
      { new: true, runValidators: true }
    );
  }
  
  static async searchPayments(searchTerm: string, filters: {
    status?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<IPayment[]> {
    await dbConnect();
    
    let query: any = {
      ...filters,
      $or: [
        { transactionId: { $regex: searchTerm, $options: 'i' } },
        { stripePaymentId: { $regex: searchTerm, $options: 'i' } },
        { paypalPaymentId: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }
    
    return await Payment.find(query)
      .populate('orderId', 'orderNumber title')
      .sort({ createdAt: -1 })
      .limit(20);
  }
  
  static async getPaymentHistory(orderId: string): Promise<{
    payments: IPayment[];
    totalPaid: number;
    totalRefunded: number;
    outstandingAmount: number;
  }> {
    await dbConnect();
    
    const [payments, order] = await Promise.all([
      Payment.find({ orderId }).sort({ createdAt: -1 }),
      Order.findById(orderId)
    ]);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    const totalPaid = payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalRefunded = payments
      .filter(p => p.status === PaymentStatus.REFUNDED)
      .reduce((sum, p) => sum + (p.refundAmount || 0), 0);
    
    const outstandingAmount = Math.max(0, order.totalAmount - totalPaid + totalRefunded);
    
    return {
      payments,
      totalPaid,
      totalRefunded,
      outstandingAmount
    };
  }
  
  static async retryFailedPayment(id: string): Promise<IPayment | null> {
    await dbConnect();
    
    const payment = await Payment.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    if (payment.status !== PaymentStatus.FAILED) {
      throw new Error('Only failed payments can be retried');
    }
    
    // Reset payment status and clear failure reason
    payment.status = PaymentStatus.PENDING;
    payment.failureReason = undefined;
    
    return await payment.save();
  }
  
  static async getPaymentAnalytics(period: 'day' | 'week' | 'month' | 'year'): Promise<any> {
    await dbConnect();
    
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    return await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: PaymentStatus.COMPLETED
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === 'day' ? '%H' : 
                     period === 'week' ? '%Y-%m-%d' :
                     period === 'month' ? '%Y-%m-%d' : '%Y-%m',
              date: '$processedAt'
            }
          },
          totalAmount: { $sum: '$amount' },
          totalFees: { $sum: '$fee' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
  }
}
