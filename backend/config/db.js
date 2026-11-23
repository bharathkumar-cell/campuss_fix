const mongoose = require('mongoose');

let mongoMemoryServerInstance = null;

const connectDB = async () => {
  const targetUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_complaints';

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${targetUri}`);
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed if database is freshly created
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Database] Empty database detected. Running initial auto-seeder...');
      const seedData = require('../seed');
      await seedData(false);
    }
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to primary MongoDB URI (${error.message}).`);

    // Zero-friction fallback: Start MongoMemoryServer automatically
    try {
      console.log('[Database] Starting embedded In-Memory MongoDB Server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServerInstance = await MongoMemoryServer.create();
      const memUri = mongoMemoryServerInstance.getUri();

      await mongoose.connect(memUri);
      console.log(`[Database] In-Memory MongoDB running successfully at: ${memUri}`);
      console.log('[Database] Auto-seeding default demo accounts and categories...');

      const seedData = require('../seed');
      await seedData(false);

      console.log('[Database] System ready! You can now log in with demo credentials immediately.');
    } catch (memError) {
      console.error('[Database Fatal Error] Failed to start fallback MongoDB:', memError.message);
      console.warn('[Database] Please install/start MongoDB locally (mongod) or provide a cloud MONGODB_URI in backend/.env');
    }
  }
};

module.exports = connectDB;
