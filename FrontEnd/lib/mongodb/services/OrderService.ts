
import { Order, IOrder, OrderStatus, ProductType, Priority } from '../models/Order';
import { User } from '../models/User';
import { Notification, NotificationType } from '../models/Notification';
import { dbConnect } from '../connection';

export class OrderService {
  
  static async createOrder(orderData: {
    customerId: string;
    productType: ProductType;
    title: string;
    description?: string;
    priority?: Priority;
    totalAmount: number;
    dueDate?: Date;
  }): Promise<IOrder> {
    await dbConnect();
    
    // Verify customer exists
    const customer = await User.findById(orderData.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    const order = new Order(orderData);
    const savedOrder = await order.save();
    
    // Create notification for customer
    await Notification.create({
      userId: orderData.customerId,
      orderId: savedOrder._id,
      title: 'Order Created',
      message: `Your order "${orderData.title}" has been created successfully`,
      type: NotificationType.ORDER_CREATED
    });
    
    return savedOrder;
  }
  
  static async getOrderById(id: string, populate: boolean = true): Promise<IOrder | null> {
    await dbConnect();
    
    let query = Order.findById(id);
    
    if (populate) {
      query = query.populate([
        { path: 'customerId', select: 'name email phone role' },
        { path: 'reviewerId', select: 'name email specialization hourlyRate' }
      ]);
    }
    
    return await query;
  }
  
  static async getOrderByNumber(orderNumber: string): Promise<IOrder | null> {
    await dbConnect();
    
    return await Order.findByOrderNumber(orderNumber)
      .populate([
        { path: 'customerId', select: 'name email phone role' },
        { path: 'reviewerId', select: 'name email specialization hourlyRate' }
      ]);
  }
  
  static async getOrdersByCustomer(
    customerId: string, 
    filters: {
      status?: OrderStatus;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ orders: IOrder[]; total: number; pages: number }> {
    await dbConnect();
    
    const { page = 1, limit = 20, ...otherFilters } = filters;
    const skip = (page - 1) * limit;
    
    let query: any = { customerId, ...otherFilters };
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('reviewerId', 'name specialization')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);
    
    return {
      orders,
      total,
      pages: Math.ceil(total / limit)
    };
  }
  
  static async getOrdersByReviewer(
    reviewerId: string, 
    filters: {
      status?: OrderStatus;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ orders: IOrder[]; total: number; pages: number }> {
    await dbConnect();
    
    const { page = 1, limit = 20, ...otherFilters } = filters;
    const skip = (page - 1) * limit;
    
    let query: any = { reviewerId, ...otherFilters };
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customerId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);
    
    return {
      orders,
      total,
      pages: Math.ceil(total / limit)
    };
  }
  
  static async assignReviewer(orderId: string, reviewerId: string): Promise<IOrder | null> {
    await dbConnect();
    
    // Verify reviewer exists and is active
    const reviewer = await User.findById(reviewerId);
    if (!reviewer || !reviewer.isActive || !reviewer.isReviewer()) {
      throw new Error('Invalid or inactive reviewer');
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (!order.canBeAssigned()) {
      throw new Error('Order cannot be assigned at this time');
    }
    
    order.reviewerId = reviewerId as any;
    order.status = OrderStatus.ASSIGNED;
    order.assignedAt = new Date();
    
    const updatedOrder = await order.save();
    
    // Create notifications
    await Promise.all([
      Notification.create({
        userId: order.customerId,
        orderId: order._id,
        title: 'Order Assigned',
        message: `Your order has been assigned to ${reviewer.name}`,
        type: NotificationType.ORDER_ASSIGNED
      }),
      Notification.create({
        userId: reviewerId,
        orderId: order._id,
        title: 'New Order Assignment',
        message: `You have been assigned a new order: ${order.title}`,
        type: NotificationType.ORDER_ASSIGNED
      })
    ]);
    
    return updatedOrder;
  }
  
  static async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<IOrder | null> {
    await dbConnect();
    
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    const oldStatus = order.status;
    order.status = status;
    
    // Set completion date if status is completed
    if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    }
    
    const updatedOrder = await order.save();
    
    // Create notification for status change
    if (oldStatus !== status) {
      await Notification.create({
        userId: order.customerId,
        orderId: order._id,
        title: 'Order Status Updated',
        message: `Your order status has been updated to ${status}`,
        type: NotificationType.ORDER_UPDATED
      });
    }
    
    return updatedOrder;
  }
  
  static async getPendingOrders(filters: {
    priority?: Priority;
    productType?: ProductType;
    limit?: number;
  } = {}): Promise<IOrder[]> {
    await dbConnect();
    
    let query: any = { status: OrderStatus.PENDING_REVIEW };
    
    if (filters.priority) {
      query.priority = filters.priority;
    }
    
    if (filters.productType) {
      query.productType = filters.productType;
    }
    
    return await Order.find(query)
      .populate('customerId', 'name email phone')
      .sort({ priority: -1, createdAt: 1 })
      .limit(filters.limit || 50);
  }
  
  static async getOverdueOrders(): Promise<IOrder[]> {
    await dbConnect();
    
    return await Order.findOverdueOrders()
      .populate([
        { path: 'customerId', select: 'name email phone' },
        { path: 'reviewerId', select: 'name email' }
      ]);
  }
  
  static async searchOrders(searchTerm: string, filters: {
    customerId?: string;
    reviewerId?: string;
    status?: OrderStatus;
  } = {}): Promise<IOrder[]> {
    await dbConnect();
    
    let query: any = {
      ...filters,
      $or: [
        { orderNumber: { $regex: searchTerm, $options: 'i' } },
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    return await Order.find(query)
      .populate([
        { path: 'customerId', select: 'name email' },
        { path: 'reviewerId', select: 'name email' }
      ])
      .sort({ createdAt: -1 })
      .limit(20);
  }
  
  static async getOrderStats(filters: {
    startDate?: Date;
    endDate?: Date;
    customerId?: string;
    reviewerId?: string;
  } = {}): Promise<any> {
    await dbConnect();
    
    let matchQuery: any = {};
    
    if (filters.startDate || filters.endDate) {
      matchQuery.createdAt = {};
      if (filters.startDate) matchQuery.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchQuery.createdAt.$lte = filters.endDate;
    }
    
    if (filters.customerId) matchQuery.customerId = filters.customerId;
    if (filters.reviewerId) matchQuery.reviewerId = filters.reviewerId;
    
    return await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaidAmount: { $sum: '$paidAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING_REVIEW'] }, 1, 0] }
          },
          assignedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'ASSIGNED'] }, 1, 0] }
          },
          inProgressOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
          },
          averageOrderValue: { $avg: '$totalAmount' },
          statusBreakdown: {
            $push: '$status'
          }
        }
      }
    ]);
  }
  
  static async updateOrder(orderId: string, updates: Partial<IOrder>): Promise<IOrder | null> {
    await dbConnect();
    
    // Prevent updating certain fields directly
    const { _id, orderNumber, createdAt, ...safeUpdates } = updates;
    
    return await Order.findByIdAndUpdate(
      orderId,
      safeUpdates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'customerId', select: 'name email phone' },
      { path: 'reviewerId', select: 'name email specialization' }
    ]);
  }
  
  static async cancelOrder(orderId: string, reason?: string): Promise<IOrder | null> {
    await dbConnect();
    
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.status === OrderStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed order');
    }
    
    order.status = OrderStatus.CANCELLED;
    const updatedOrder = await order.save();
    
    // Create notification
    await Notification.create({
      userId: order.customerId,
      orderId: order._id,
      title: 'Order Cancelled',
      message: `Your order has been cancelled${reason ? `: ${reason}` : ''}`,
      type: NotificationType.ORDER_UPDATED
    });
    
    return updatedOrder;
  }
  
  static async getOrderTimeline(orderId: string): Promise<any[]> {
    await dbConnect();
    
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    const timeline = [];
    
    timeline.push({
      event: 'Order Created',
      date: order.createdAt,
      status: 'PENDING_REVIEW'
    });
    
    if (order.assignedAt) {
      timeline.push({
        event: 'Order Assigned',
        date: order.assignedAt,
        status: 'ASSIGNED'
      });
    }
    
    if (order.completedAt) {
      timeline.push({
        event: 'Order Completed',
        date: order.completedAt,
        status: 'COMPLETED'
      });
    }
    
    return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
