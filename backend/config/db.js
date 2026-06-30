// ============================================================
// FILE: backend/config/db.js
// OWNER: Member 1 (Project Lead)
// RESPONSIBILITY: MongoDB Atlas connection via Mongoose
// ============================================================

import mongoose from 'mongoose';

const parseMongoHost = (uri) => {
  try {
    const parsed = new URL(uri);
    return `${parsed.host}${parsed.pathname || ''}`;
  } catch {
    return uri;
  }
};

const connectWithUri = async (uri) => {
  mongoose.set('strictQuery', false);
  return mongoose.connect(uri, {
    dbName: process.env.DB_NAME || undefined,
  });
};

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017';

  if (!primaryUri) {
    throw new Error('MONGODB_URI is not defined in backend/.env');
  }

  try {
    console.log(`🔎 Trying MongoDB primary URI host: ${parseMongoHost(primaryUri)}`);
    const conn = await connectWithUri(primaryUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (primaryError) {
    console.error('❌ Primary MongoDB connection failed:', primaryError.message);
    console.error(`Attempting local fallback to ${fallbackUri}`);

    try {
      console.log(`🔎 Trying local MongoDB fallback host: ${parseMongoHost(fallbackUri)}`);
      const conn = await connectWithUri(fallbackUri);
      console.log(`✅ Local MongoDB fallback connected: ${conn.connection.host}`);
      return conn;
    } catch (fallbackError) {
      console.error('❌ Local fallback connection failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

export const disconnectFromMongoDB = async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
};

export default connectDB;