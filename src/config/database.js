const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✓ MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
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
    
    // Don't exit - allow server to start for testing without MongoDB
    console.error('\n⚠️  Starting server WITHOUT database connection...');
    console.error('⚠️  Sign-up and Login will fail until MongoDB is configured\n');
  }
};

module.exports = connectDB;
