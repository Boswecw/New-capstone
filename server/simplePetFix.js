// If the .env loading doesn't work, use this version

const mongoose = require('mongoose');
const Pet = require('./models/Pet');

// ⚠️ TEMPORARY: Replace with your actual MongoDB connection string
const MONGODB_URI = 'mongodb+srv://your_username:your_password@your_cluster.mongodb.net/FurBabies';

async function simplePetFix() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // You'll need to replace the connection string above with your actual one
    if (MONGODB_URI.includes('your_username')) {
      console.error('❌ Please update the MONGODB_URI in this script with your actual connection string');
      console.log('💡 Find your connection string in:');
      console.log('   1. Your .env file');
      console.log('   2. MongoDB Atlas dashboard');
      console.log('   3. Or copy from your working server.js');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check current state
    const totalPets = await Pet.countDocuments();
    console.log('📊 Total pets found:', totalPets);

    if (totalPets === 0) {
      console.log('❌ No pets found in database.');
      console.log('💡 You need to import pet data first or check if you\'re connected to the right database.');
      process.exit(1);
    }

    // Check what fields are missing
    const samplePet = await Pet.findOne();
    console.log('🔍 Sample pet structure:', {
      name: samplePet?.name,
      type: samplePet?.type,
      status: samplePet?.status || 'MISSING',
      createdBy: samplePet?.createdBy || 'MISSING',
      category: samplePet?.category || 'MISSING'
    });

    // Count missing fields
    const petsWithoutStatus = await Pet.countDocuments({ status: { $exists: false } });
    const petsWithoutCreatedBy = await Pet.countDocuments({ createdBy: { $exists: false } });
    
    console.log('❌ Pets missing status field:', petsWithoutStatus);
    console.log('❌ Pets missing createdBy field:', petsWithoutCreatedBy);

    if (petsWithoutStatus === 0 && petsWithoutCreatedBy === 0) {
      console.log('✅ All pets have required fields!');
      
      // Test a query that your API uses
      const availablePets = await Pet.find({ status: 'available' }).limit(5);
      console.log('✅ Found available pets:', availablePets.length);
      
      if (availablePets.length > 0) {
        console.log('🎉 Your pets should be visible in the admin panel!');
      } else {
        console.log('❓ No available pets found. Checking statuses...');
        const statusBreakdown = await Pet.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('📊 Status breakdown:', statusBreakdown);
      }
      
      process.exit(0);
    }

    // Create a dummy user ID
    const dummyUserId = new mongoose.Types.ObjectId();
    console.log('🔧 Using dummy user ID:', dummyUserId);

    // Fix missing status
    if (petsWithoutStatus > 0) {
      console.log('🔧 Adding status field to pets...');
      const result = await Pet.updateMany(
        { status: { $exists: false } },
        { $set: { status: 'available' } }
      );
      console.log(`✅ Added status to ${result.modifiedCount} pets`);
    }

    // Fix missing createdBy
    if (petsWithoutCreatedBy > 0) {
      console.log('🔧 Adding createdBy field to pets...');
      const result = await Pet.updateMany(
        { createdBy: { $exists: false } },
        { $set: { createdBy: dummyUserId } }
      );
      console.log(`✅ Added createdBy to ${result.modifiedCount} pets`);
    }

    // Set category based on type if missing
    await Pet.updateMany(
      { type: 'dog', category: { $exists: false } },
      { $set: { category: 'dog' } }
    );
    await Pet.updateMany(
      { type: 'cat', category: { $exists: false } },
      { $set: { category: 'cat' } }
    );
    await Pet.updateMany(
      { type: 'fish', category: { $exists: false } },
      { $set: { category: 'aquatic' } }
    );
    await Pet.updateMany(
      { type: { $in: ['small-pet', 'bird'] }, category: { $exists: false } },
      { $set: { category: 'other' } }
    );

    // Final test
    console.log('🧪 Testing final result...');
    const availablePetsAfter = await Pet.countDocuments({ status: 'available' });
    const smallPets = await Pet.countDocuments({ type: 'small-pet', status: 'available' });
    
    console.log('✅ Available pets after fix:', availablePetsAfter);
    console.log('✅ Available small pets:', smallPets);

    // Show breakdown by type
    const typeStats = await Pet.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('📈 Pet breakdown by type:');
    typeStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} pets`);
    });

    console.log('🎉 Pet data fixed successfully!');
    console.log('🔄 Try refreshing your admin panel now.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    if (error.message.includes('uri')) {
      console.log('💡 Make sure to update the MONGODB_URI at the top of this script');
    }
    process.exit(1);
  }
}

// Run the fix
simplePetFix();