// server/create-schema-correct-admin.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('./models/User');

const createSchemaCorrectAdmin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing admin if it exists
    const existingAdmin = await User.findOne({ email: 'realadmin@furbabies.com' });
    if (existingAdmin) {
      await User.deleteOne({ email: 'realadmin@furbabies.com' });
      console.log('🗑️  Deleted existing realadmin user');
    }

    // Create admin user that ONLY uses fields from the actual schema
    const adminUser = new User({
      name: 'Real Admin',  // ✅ This field exists in schema
      email: 'realadmin@furbabies.com',  // ✅ This field exists
      password: 'RealAdmin123!',  // ✅ This field exists  
      role: 'admin',  // ✅ This field exists
      isActive: true,  // ✅ This field exists
      profile: {  // ✅ This field exists with nested structure
        avatar: 'https://via.placeholder.com/150x150?text=Admin',
        bio: 'System administrator account',
        preferences: {
          notifications: {
            email: true,
            newPets: true,
            adoptionUpdates: true
          }
        }
      }
      // ❌ NO USERNAME FIELD - it doesn't exist in the schema!
    });

    console.log('💾 Saving admin user with correct schema...');
    await adminUser.save();
    
    console.log('🎉 Schema-correct admin user created successfully!');
    console.log('📧 Email: realadmin@furbabies.com');
    console.log('🔑 Password: RealAdmin123!');
    console.log('👤 Role: admin');
    console.log('✅ Active: true');
    console.log('');
    console.log('✨ This should work since it matches your User schema exactly!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating schema-correct admin user:', error);
    console.log('📋 Full error details:', error.message);
    if (error.stack) {
      console.log('📋 Stack trace:', error.stack);
    }
    process.exit(1);
  }
};

createSchemaCorrectAdmin();