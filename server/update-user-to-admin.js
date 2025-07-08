// update-user-to-admin.js
// Updates an existing user to admin role

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const mongoose = require('mongoose');
const User = require('./models/User');

async function updateUserToAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // UPDATE THIS EMAIL to the user you want to make admin
    const userEmail = 'charliewboswell@gmail.com';

    const user = await User.findByEmail(userEmail);
    if (!user) {
      console.log('❌ User not found with email:', userEmail);
      process.exit(1);
    }

    // Update user to admin
    user.role = 'admin';
    await user.save();

    console.log('🎉 User updated to admin successfully!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    console.log('👑 Role:', user.role);
    console.log('🆔 User ID:', user._id);

  } catch (error) {
    console.error('❌ Error updating user:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
    process.exit(0);
  }
}

updateUserToAdmin();