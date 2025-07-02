// test-mongodb.js - Simple version without syntax errors
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not found in .env file');
      process.exit(1);
    }
    
    // Hide password in log
    const hiddenUri = process.env.MONGODB_URI.replace(/:([^:@]{1,})@/, ':***@');
    console.log('Connection string:', hiddenUri);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connection successful!');
    
    // Test creating a document
    const TestSchema = new mongoose.Schema({
      name: String,
      date: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('Test', TestSchema);
    const testDoc = new TestModel({ name: 'Connection Test' });
    
    await testDoc.save();
    console.log('✅ Document created successfully!');
    
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Document deleted successfully!');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully!');
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('Check your username and password in the connection string');
    }
    
    if (error.message.includes('network')) {
      console.error('Check your internet connection and MongoDB Atlas settings');
    }
    
    process.exit(1);
  }
}

testConnection();