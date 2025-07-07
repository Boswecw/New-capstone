// server/check-admin-role.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('./models/User');

const checkAndFixAdminRole = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@furbabies.com' });
    
    if (!adminUser) {
      console.log('❌ User admin@furbabies.com not found!');
      process.exit(1);
    }

    console.log('👤 Found user:');
    console.log('📧 Email:', adminUser.email);
    console.log('👤 Name:', adminUser.name);
    console.log('🏷️  Current Role:', adminUser.role);
    console.log('✅ Active:', adminUser.isActive);

    if (adminUser.role === 'admin') {
      console.log('🎉 User already has admin role! You can login now.');
    } else {
      console.log('🔧 Updating user role to admin...');
      
      adminUser.role = 'admin';
      await adminUser.save();
      
      console.log('✅ User role updated to admin!');
      console.log('🎉 You can now login with admin privileges!');
    }

    console.log('');
    console.log('📋 Login Credentials:');
    console.log('📧 Email: admin@furbabies.com');
    console.log('🔑 Password: Admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
    process.exit(1);
  }
};

checkAndFixAdminRole();
