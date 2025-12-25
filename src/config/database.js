const mongoose = require('mongoose');

// Global cached connection for Vercel serverless functions
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Return cached connection if it exists
  if (cached.conn) {
    console.log('✓ Using cached MongoDB connection');
    return cached.conn;
  }

  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // If no promise exists, create a new connection
    if (!cached.promise) {
      const opts = {
        bufferCommands: false, // Critical for Vercel - disable buffering
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      };

      cached.promise = mongoose.connect(mongoURI, opts).then((mongoose) => {
        console.log('✓ MongoDB connected successfully');
        return mongoose;
      });
    }

    // Wait for connection and cache it
    cached.conn = await cached.promise;
    return cached.conn;
    
  } catch (error) {
    cached.promise = null; // Reset promise on error
    console.error('✗ MongoDB connection failed:', error.message);
    console.error('\n📝 SETUP INSTRUCTIONS:');
    console.error('1. Go to https://www.mongodb.com/cloud/atlas');
    console.error('2. Create a cluster (M0 free tier)');
    console.error('3. Get connection string from "Connect" button');
    console.error('4. Update MONGODB_URI in .env file');
    console.error('5. URL encode special characters in password:');
    console.error('   - @ becomes %40');
    console.error('   - # becomes %23');
    console.error('   - : becomes %3A');
    console.error('\nExample: mongodb+srv://user:pass%40word@cluster.mongodb.net/db');
    console.error('\n⚠️  Connection error - server will retry on next request\n');
    throw error;
  }
};

module.exports = connectDB;
