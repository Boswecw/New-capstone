// Create this file as: server/fixPetData.js
// This script adds missing required fields to existing pets in MongoDB

const mongoose = require('mongoose');
const Pet = require('./models/Pet');
require('dotenv').config();

async function fixPetData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check current state
    const totalPets = await Pet.countDocuments();
    console.log('📊 Total pets found:', totalPets);

    if (totalPets === 0) {
      console.log('❌ No pets found in database. You need to import pet data first.');
      console.log('💡 Run: node importPets.js');
      process.exit(1);
    }

    // Check for missing fields
    const petsWithoutStatus = await Pet.countDocuments({ status: { $exists: false } });
    const petsWithoutCreatedBy = await Pet.countDocuments({ createdBy: { $exists: false } });
    const petsWithoutCategory = await Pet.countDocuments({ category: { $exists: false } });
    
    console.log('❌ Pets missing status field:', petsWithoutStatus);
    console.log('❌ Pets missing createdBy field:', petsWithoutCreatedBy);
    console.log('❌ Pets missing category field:', petsWithoutCategory);

    if (petsWithoutStatus === 0 && petsWithoutCreatedBy === 0 && petsWithoutCategory === 0) {
      console.log('✅ All pets have required fields! No fixes needed.');
      process.exit(0);
    }

    // Create a dummy user ID for createdBy field
    const dummyUserId = new mongoose.Types.ObjectId();

    // Fix missing fields
    console.log('🔧 Adding missing fields to pets...');

    // Update pets with missing status
    if (petsWithoutStatus > 0) {
      const statusResult = await Pet.updateMany(
        { status: { $exists: false } },
        { $set: { status: 'available' } }
      );
      console.log(`✅ Added status to ${statusResult.modifiedCount} pets`);
    }

    // Update pets with missing createdBy
    if (petsWithoutCreatedBy > 0) {
      const createdByResult = await Pet.updateMany(
        { createdBy: { $exists: false } },
        { $set: { createdBy: dummyUserId } }
      );
      console.log(`✅ Added createdBy to ${createdByResult.modifiedCount} pets`);
    }

    // Fix category based on type
    if (petsWithoutCategory > 0) {
      console.log('🔧 Setting categories based on pet types...');
      
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
        { 
          type: { $in: ['small-pet', 'bird', 'rabbit', 'hamster', 'other'] },
          category: { $exists: false }
        },
        { $set: { category: 'other' } }
      );
      
      console.log('✅ Categories set based on pet types');
    }

    // Add other optional fields with defaults
    await Pet.updateMany(
      {},
      {
        $set: {
          featured: false,
          views: 0,
          favorites: 0
        }
      }
    );

    // Final verification
    console.log('🔍 Verifying fixes...');
    
    const finalStats = await Pet.aggregate([
      {
        $group: {
          _id: null,
          totalPets: { $sum: 1 },
          availablePets: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          petsWithCreatedBy: { $sum: { $cond: [{ $ne: ['$createdBy', null] }, 1, 0] } },
          petsWithCategory: { $sum: { $cond: [{ $ne: ['$category', null] }, 1, 0] } }
        }
      }
    ]);

    console.log('📊 Final stats:', finalStats[0]);

    // Show breakdown by type
    const typeStats = await Pet.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('📈 Pet breakdown by type:');
    typeStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} pets`);
    });

    console.log('✅ All pets updated successfully!');
    console.log('🎉 Your admin panel should now show pets!');
    console.log('🔄 Try refreshing your admin page.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixPetData();