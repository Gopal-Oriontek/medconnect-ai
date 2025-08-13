
# Medical Review Platform - MongoDB Database

This directory contains the complete MongoDB database implementation for the Medical Review Platform, providing a robust, scalable, and feature-rich data layer.

## 📁 Directory Structure

```
lib/mongodb/
├── connection.ts          # Database connection management
├── models/               # Mongoose models and schemas
│   ├── User.ts           # User model with roles and authentication
│   ├── Order.ts          # Order management and tracking
│   ├── Document.ts       # File upload and document management
│   ├── Review.ts         # Medical reviews and assessments
│   ├── Consultation.ts   # Video consultation scheduling
│   ├── Payment.ts        # Payment processing and tracking
│   ├── Notification.ts   # User notifications system
│   ├── Account.ts        # NextAuth.js account integration
│   ├── Session.ts        # Session management
│   ├── VerificationToken.ts # Email/phone verification
│   └── index.ts          # Model exports and types
├── services/             # Business logic and data operations
│   ├── UserService.ts    # User management operations
│   ├── OrderService.ts   # Order workflow management
│   ├── DocumentService.ts # File handling and storage
│   ├── ReviewService.ts  # Medical review operations
│   ├── ConsultationService.ts # Consultation scheduling
│   ├── PaymentService.ts # Payment processing
│   ├── NotificationService.ts # Notification management
│   └── index.ts          # Service exports
├── utils/                # Utilities and helpers
│   ├── database.ts       # Database utilities and stats
│   └── seed.ts           # Database seeding and sample data
├── adapters/             # Third-party integrations
│   └── next-auth.ts      # NextAuth.js MongoDB adapter
└── README.md             # This documentation file
```

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file with your MongoDB connection string:

```env
MONGODB_URI="mongodb://localhost:27017/medical_review_platform"
# OR for MongoDB Atlas:
# MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/medical_review_platform"
```

### 2. Install Dependencies

```bash
yarn add mongoose @types/mongoose
```

### 3. Basic Usage

```typescript
import { dbConnect } from '@/lib/mongodb/connection';
import { UserService, OrderService } from '@/lib/mongodb/services';

// Connect to database
await dbConnect();

// Create a new user
const user = await UserService.createUser({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'CUSTOMER'
});

// Create an order
const order = await OrderService.createOrder({
  customerId: user.id,
  productType: 'SECOND_OPINION',
  title: 'Medical Review Request',
  totalAmount: 250
});
```

## 🗄️ Database Schema

### Core Models

#### User Model
- **Purpose**: Manages customers, reviewers, and administrators
- **Key Features**: 
  - Role-based access (CUSTOMER, REVIEWER, ADMIN)
  - Profile management with specializations for reviewers
  - Email verification and authentication support
  - Availability scheduling for reviewers

#### Order Model
- **Purpose**: Central workflow management for medical reviews
- **Key Features**:
  - Multiple product types (Second Opinion, Consultation, etc.)
  - Status tracking through the review lifecycle
  - Priority management and due date tracking
  - Payment integration and tracking

#### Review Model
- **Purpose**: Stores medical professional assessments
- **Key Features**:
  - Rich content with recommendations
  - Severity classification system
  - Review time tracking and performance metrics
  - Tag system for categorization
  - Rating and feedback system

#### Document Model
- **Purpose**: File upload and document management
- **Key Features**:
  - Support for multiple file types (PDF, images, documents)
  - File size validation and metadata storage
  - Download tracking and access control
  - Soft delete with cleanup utilities

#### Consultation Model
- **Purpose**: Video consultation scheduling and management
- **Key Features**:
  - Flexible scheduling with timezone support
  - Meeting link generation and management
  - Reminder system (24h, 1h, 15min)
  - Rating and feedback collection
  - Reschedule history tracking

#### Payment Model
- **Purpose**: Comprehensive payment processing
- **Key Features**:
  - Multiple payment methods support
  - Fee calculation and net amount tracking
  - Refund management with reason tracking
  - Integration with Stripe and PayPal
  - Detailed transaction history

#### Notification Model
- **Purpose**: Multi-channel notification system
- **Key Features**:
  - Email, SMS, and push notification support
  - Priority-based delivery
  - Read/unread status tracking
  - Automatic expiration and cleanup
  - Rich notification content with actions

### Authentication Models

#### Account, Session, VerificationToken
- **Purpose**: NextAuth.js integration for authentication
- **Key Features**:
  - OAuth provider support
  - Session management with expiration
  - Email verification workflow
  - Password reset functionality

## 🔧 Service Layer

### UserService
```typescript
// Create user with role-based permissions
const user = await UserService.createUser({
  name: 'Dr. Smith',
  email: 'dr.smith@hospital.com',
  role: 'REVIEWER',
  specialization: 'Cardiology',
  licenseNumber: 'MD12345'
});

// Get reviewers by specialization
const cardiologists = await UserService.getReviewers({
  specialization: 'Cardiology',
  isActive: true
});
```

### OrderService
```typescript
// Create new order
const order = await OrderService.createOrder({
  customerId: 'user123',
  productType: 'SECOND_OPINION',
  title: 'Cardiac Assessment Review',
  totalAmount: 500
});

// Assign reviewer
await OrderService.assignReviewer(order.id, 'reviewer456');

// Get order statistics
const stats = await OrderService.getOrderStats({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});
```

### DocumentService
```typescript
// Upload document with validation
const document = await DocumentService.uploadDocument({
  orderId: 'order123',
  fileName: 'report.pdf',
  originalName: 'Medical Report.pdf',
  fileSize: 1024000,
  fileType: 'application/pdf',
  filePath: '/uploads/report.pdf',
  uploadedBy: 'user123'
});

// Download with permission check
const { document, filePath } = await DocumentService.downloadDocument(
  'doc123', 
  'user123'
);
```

## 📊 Database Utilities

### Database Statistics
```typescript
import { DatabaseUtils } from '@/lib/mongodb/utils/database';

// Get comprehensive database statistics
const stats = await DatabaseUtils.getDatabaseStats();
console.log(`Total users: ${stats.users.totalUsers}`);
console.log(`Total orders: ${stats.orders.totalOrders}`);

// Health check
const health = await DatabaseUtils.healthCheck();
console.log(`Database status: ${health.status}`);
```

### Data Seeding
```typescript
import { SeedData } from '@/lib/mongodb/utils/seed';

// Create sample data for development
await SeedData.seedDatabase();

// Clear database (use with caution!)
await SeedData.clearDatabase();
```

## 🔍 Advanced Queries

### Complex Aggregations
```typescript
// Get reviewer performance metrics
const reviewerStats = await Review.aggregate([
  { $match: { reviewerId: new ObjectId('reviewer123') } },
  {
    $group: {
      _id: null,
      averageReviewTime: { $avg: '$reviewTime' },
      averageRating: { $avg: '$ratings.overall' },
      totalReviews: { $sum: 1 },
      completionRate: { $avg: { $cond: ['$isComplete', 1, 0] } }
    }
  }
]);

// Get payment analytics by time period
const paymentAnalytics = await PaymentService.getPaymentAnalytics('month');
```

### Full-Text Search
```typescript
// Search orders by title and description
const orders = await OrderService.searchOrders('cardiac assessment', {
  status: OrderStatus.COMPLETED
});

// Search users by multiple fields
const users = await UserService.searchUsers('cardiology', UserRole.REVIEWER);
```

## 🔒 Security Features

### Data Validation
- **Schema Validation**: Comprehensive Mongoose schema validation
- **File Upload Validation**: File type, size, and security checks
- **Input Sanitization**: Automatic data cleaning and validation
- **Permission Checks**: Role-based access control throughout

### Privacy Protection
- **Password Hashing**: bcrypt integration for secure password storage
- **Token Management**: Secure verification token generation
- **Data Masking**: Sensitive data is automatically masked in API responses
- **Soft Deletes**: Secure data deletion with recovery options

## 📈 Performance Optimization

### Database Indexes
All models include optimized indexes for:
- Primary lookups (user ID, order ID, etc.)
- Search operations (email, order number, etc.)
- Filtering and sorting (status, date ranges, etc.)
- Compound queries (user + status, date + type, etc.)

### Query Optimization
- **Population**: Efficient related data loading
- **Pagination**: Built-in pagination for large datasets
- **Aggregation**: Complex queries using MongoDB aggregation pipeline
- **Caching**: Ready for Redis integration for frequently accessed data

## 🧪 Testing Support

### Sample Data Generation
```typescript
// Generate realistic sample data
await DatabaseUtils.createSampleData();

// Create specific test scenarios
const testUsers = await SeedData.createUsers();
const testOrders = await SeedData.createOrders(testUsers);
```

### Database Cleanup
```typescript
// Clean up old data
const cleaned = await DatabaseUtils.cleanupExpiredData();
console.log(`Cleaned ${cleaned.expiredSessions} sessions`);

// Cleanup inactive documents
const deletedDocs = await DocumentService.cleanupInactiveDocuments(30);
```

## 🔄 Migration Support

### Schema Updates
```typescript
// Run database migrations
await DatabaseUtils.runMigrations();

// Initialize database with indexes
await DatabaseUtils.initializeDatabase();
```

### Data Backup
```typescript
// Backup specific collections
const backup = await DatabaseUtils.backupData(['users', 'orders']);

// Full database backup
const fullBackup = await DatabaseUtils.backupData();
```

## 🌍 Environment Configuration

### Development
```env
MONGODB_URI="mongodb://localhost:27017/medical_review_platform_dev"
NODE_ENV="development"
```

### Production
```env
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/medical_review_platform"
NODE_ENV="production"
```

### Testing
```env
MONGODB_URI="mongodb://localhost:27017/medical_review_platform_test"
NODE_ENV="test"
```

## 🤝 Integration Examples

### NextAuth.js Integration
```typescript
import NextAuth from 'next-auth';
import { MongooseAdapter } from '@/lib/mongodb/adapters/next-auth';

export default NextAuth({
  adapter: MongooseAdapter(),
  // ... other NextAuth configuration
});
```

### API Route Example
```typescript
// pages/api/orders/[id].ts
import { OrderService } from '@/lib/mongodb/services';

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    const order = await OrderService.getOrderById(id);
    res.status(200).json(order);
  } catch (error) {
    res.status(404).json({ error: 'Order not found' });
  }
}
```

## 📚 Additional Resources

- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
- [NextAuth.js MongoDB Integration](https://next-auth.js.org/adapters/mongodb)

## 🐛 Troubleshooting

### Common Issues

1. **Connection Issues**
   ```typescript
   // Check connection status
   const health = await DatabaseUtils.healthCheck();
   ```

2. **Schema Validation Errors**
   ```typescript
   // Validate data before saving
   const user = new User(userData);
   await user.validate();
   ```

3. **Performance Issues**
   ```typescript
   // Check database statistics
   const stats = await DatabaseUtils.getDatabaseStats();
   ```

This MongoDB implementation provides a robust, scalable foundation for the Medical Review Platform with comprehensive features, security, and performance optimizations.
