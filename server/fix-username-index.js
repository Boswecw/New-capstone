// server/fix-username-index.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');

const fixUsernameIndex = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('🔍 Checking existing indexes...');
    const indexes = await usersCollection.indexes();
    console.log('📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (${index.name})`);
    });

    // Check if username index exists
    const usernameIndex = indexes.find(index => index.key.username);
    
    if (usernameIndex) {
      console.log('🔧 Found problematic username index. Dropping it...');
      await usersCollection.dropIndex('username_1');
      console.log('✅ Successfully dropped username index!');
    } else {
      console.log('❓ No username index found');
    }

    console.log('🔍 Checking for users with null usernames...');
    const nullUsernameUsers = await usersCollection.find({ username: null }).toArray();
    console.log(`📊 Found ${nullUsernameUsers.length} users with null usernames`);

    if (nullUsernameUsers.length > 0) {
      console.log('🧹 Cleaning up null username fields...');
      await usersCollection.updateMany(
        { username: null },
        { $unset: { username: "" } }
      );
      console.log('✅ Removed null username fields from existing users');
    }

    console.log('');
    console.log('🎉 Database cleanup complete!');
    console.log('✨ You should now be able to create admin users without the duplicate key error');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing username index:', error);
    console.log('📋 Full error details:', error.message);
    process.exit(1);
  }
};

fixUsernameIndex();