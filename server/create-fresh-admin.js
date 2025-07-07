// server/create-fresh-admin.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('./models/User');

const createFreshAdmin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing admin if it exists (to start fresh)
    const existingAdmin = await User.findOne({ email: 'superadmin@furbabies.com' });
    if (existingAdmin) {
      await User.deleteOne({ email: 'superadmin@furbabies.com' });
      console.log('🗑️  Deleted existing superadmin user');
    }

    // Create completely fresh admin user
    const adminUser = new User({
      name: 'Super Admin',
      username: 'superadmin',  // ADD THIS LINE!
      email: 'superadmin@furbabies.com',
      password: 'SuperAdmin123!',
      role: 'admin',
      isActive: true,
      profile: {
        firstName: 'Super',
        lastName: 'Admin'
      }
    });

    console.log('💾 Saving admin user...');
    await adminUser.save();
    
    console.log('🎉 Fresh admin user created successfully!');
    console.log('📧 Email: superadmin@furbabies.com');
    console.log('🔑 Password: SuperAdmin123!');
    console.log('👤 Role: admin');
    console.log('');
    console.log('✨ Try logging in with these credentials!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating fresh admin user:', error);
    console.log('📋 Full error details:', error.message);
    if (error.stack) {
      console.log('📋 Stack trace:', error.stack);
    }
    process.exit(1);
  }
};

createFreshAdmin();