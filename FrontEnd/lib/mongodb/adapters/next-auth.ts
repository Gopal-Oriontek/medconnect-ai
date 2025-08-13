
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import { Account, Session, User, VerificationToken } from '../models';
import { dbConnect } from '../connection';

// Create a custom adapter that uses Mongoose models
export function MongooseAdapter() {
  return {
    async createUser(user: any) {
      await dbConnect();
      const newUser = await User.create(user);
      return newUser.toJSON();
    },

    async getUser(id: string) {
      await dbConnect();
      const user = await User.findById(id);
      return user ? user.toJSON() : null;
    },

    async getUserByEmail(email: string) {
      await dbConnect();
      const user = await User.findOne({ email });
      return user ? user.toJSON() : null;
    },

    async getUserByAccount({ providerAccountId, provider }: any) {
      await dbConnect();
      const account = await Account.findOne({ provider, providerAccountId }).populate('userId');
      return account?.userId ? account.userId.toJSON() : null;
    },

    async updateUser(user: any) {
      await dbConnect();
      const updatedUser = await User.findByIdAndUpdate(user.id, user, { new: true });
      return updatedUser ? updatedUser.toJSON() : null;
    },

    async deleteUser(userId: string) {
      await dbConnect();
      await Promise.all([
        User.findByIdAndDelete(userId),
        Account.deleteMany({ userId }),
        Session.deleteMany({ userId })
      ]);
    },

    async linkAccount(account: any) {
      await dbConnect();
      const newAccount = await Account.create(account);
      return newAccount.toJSON();
    },

    async unlinkAccount({ providerAccountId, provider }: any) {
      await dbConnect();
      const account = await Account.findOneAndDelete({ provider, providerAccountId });
      return account ? account.toJSON() : null;
    },

    async createSession(session: any) {
      await dbConnect();
      const newSession = await Session.create(session);
      return newSession.toJSON();
    },

    async getSessionAndUser(sessionToken: string) {
      await dbConnect();
      const session = await Session.findOne({ sessionToken }).populate('userId');
      
      if (!session) return null;

      return {
        session: session.toJSON(),
        user: session.userId.toJSON()
      };
    },

    async updateSession(session: any) {
      await dbConnect();
      const updatedSession = await Session.findOneAndUpdate(
        { sessionToken: session.sessionToken },
        session,
        { new: true }
      );
      return updatedSession ? updatedSession.toJSON() : null;
    },

    async deleteSession(sessionToken: string) {
      await dbConnect();
      const session = await Session.findOneAndDelete({ sessionToken });
      return session ? session.toJSON() : null;
    },

    async createVerificationToken(token: any) {
      await dbConnect();
      const newToken = await VerificationToken.create(token);
      return newToken.toJSON();
    },

    async useVerificationToken({ identifier, token }: any) {
      await dbConnect();
      const verificationToken = await VerificationToken.findOneAndDelete({ identifier, token });
      return verificationToken ? verificationToken.toJSON() : null;
    }
  };
}

// Alternative: Use the official MongoDB adapter with connection
export function createMongoDBAdapter() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  const clientPromise = client.connect();
  
  return MongoDBAdapter(clientPromise, {
    databaseName: 'medical_review_platform'
  });
}

export default MongooseAdapter;
