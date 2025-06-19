require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('Database name:', mongoose.connection.db.databaseName);
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
};

testConnection();