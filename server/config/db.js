const mongoose = require('mongoose');

let isConnected = false; // ✅ keep track of connection state

const db = async () => {
  try {
    if (isConnected) {
      console.log('🔁 Using existing MongoDB connection');
      return;
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }

    mongoose.set('bufferTimeoutMS', 30000);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 20000, // wait up to 20s
    });

    isConnected = conn.connections[0].readyState;
    console.log('✅ Database Connected Successfully');
  } catch (error) {
    console.error('❌ Error while connecting to MongoDB:', error.message);
    throw error;
  }
};

module.exports = db;
