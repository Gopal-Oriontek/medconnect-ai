
import { User, IUser, UserRole } from '../models/User';
import { dbConnect } from '../connection';
import bcrypt from 'bcryptjs';

export class UserService {
  
  static async createUser(userData: {
    name?: string;
    email: string;
    password?: string;
    phone?: string;
    role?: UserRole;
    specialization?: string;
    licenseNumber?: string;
    bio?: string;
    hourlyRate?: number;
  }): Promise<IUser> {
    await dbConnect();
    
    // Check if user already exists
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password if provided
    const hashedPassword = userData.password 
      ? await bcrypt.hash(userData.password, 12)
      : undefined;
    
    const user = new User({
      ...userData,
      password: hashedPassword,
      email: userData.email.toLowerCase()
    });
    
    return await user.save();
  }
  
  static async getUserById(id: string): Promise<IUser | null> {
    await dbConnect();
    return await User.findById(id);
  }
  
  static async getUserByEmail(email: string): Promise<IUser | null> {
    await dbConnect();
    return await User.findByEmail(email);
  }
  
  static async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    await dbConnect();
    
    // Don't allow direct password updates through this method
    const { password, ...safeUpdates } = updates;
    
    return await User.findByIdAndUpdate(
      id, 
      safeUpdates, 
      { new: true, runValidators: true }
    );
  }
  
  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    await dbConnect();
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const result = await User.findByIdAndUpdate(id, { password: hashedPassword });
    
    return !!result;
  }
  
  static async verifyPassword(email: string, password: string): Promise<IUser | null> {
    await dbConnect();
    
    const user = await User.findByEmail(email);
    if (!user || !user.password) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }
  
  static async deactivateUser(id: string): Promise<boolean> {
    await dbConnect();
    
    const result = await User.findByIdAndUpdate(id, { isActive: false });
    return !!result;
  }
  
  static async reactivateUser(id: string): Promise<boolean> {
    await dbConnect();
    
    const result = await User.findByIdAndUpdate(id, { isActive: true });
    return !!result;
  }
  
  static async getAllUsers(filters: {
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{ users: IUser[]; total: number; pages: number }> {
    await dbConnect();
    
    const { page = 1, limit = 20, search, ...otherFilters } = filters;
    const skip = (page - 1) * limit;
    
    let query: any = { ...otherFilters };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);
    
    return {
      users,
      total,
      pages: Math.ceil(total / limit)
    };
  }
  
  static async getReviewers(filters: {
    specialization?: string;
    isActive?: boolean;
    availableOnly?: boolean;
  } = {}): Promise<IUser[]> {
    await dbConnect();
    
    let query: any = { 
      role: UserRole.REVIEWER,
      isActive: filters.isActive !== false // Default to true unless explicitly false
    };
    
    if (filters.specialization) {
      query.specialization = { $regex: filters.specialization, $options: 'i' };
    }
    
    return await User.find(query)
      .sort({ hourlyRate: 1, createdAt: -1 });
  }
  
  static async getUserStats(): Promise<any> {
    await dbConnect();
    
    return await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          customers: { $sum: { $cond: [{ $eq: ['$role', 'CUSTOMER'] }, 1, 0] } },
          reviewers: { $sum: { $cond: [{ $eq: ['$role', 'REVIEWER'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'ADMIN'] }, 1, 0] } },
          verifiedUsers: { $sum: { $cond: ['$emailVerified', 1, 0] } }
        }
      }
    ]);
  }
  
  static async searchUsers(searchTerm: string, role?: UserRole): Promise<IUser[]> {
    await dbConnect();
    
    let query: any = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { specialization: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    if (role) {
      query.role = role;
    }
    
    return await User.find(query)
      .limit(10)
      .sort({ name: 1 });
  }
  
  static async verifyEmail(id: string): Promise<boolean> {
    await dbConnect();
    
    const result = await User.findByIdAndUpdate(
      id, 
      { emailVerified: new Date() }
    );
    
    return !!result;
  }
  
  static async updateAvailableSlots(id: string, slots: any): Promise<boolean> {
    await dbConnect();
    
    const result = await User.findByIdAndUpdate(
      id, 
      { availableSlots: slots }
    );
    
    return !!result;
  }
}
