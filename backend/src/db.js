const mongoose = require('mongoose');
const logger = require('./utils/logger');

const connectDB = async (retries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        autoIndex: process.env.NODE_ENV !== 'production'
      });
      logger.info('MongoDB connected');
      return mongoose.connection;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt} failed: ${error.message}`);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
};

module.exports = connectDB;
