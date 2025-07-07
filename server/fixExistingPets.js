// Create this file as: server/fixExistingPets.js
const mongoose = require('mongoose');
const Pet = require('./models/Pet');
const User = require('./models/User');
const path = require('path');
// Load .env file from parent directory (project root)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function fixExistingPets() {
  try {
    // Debug: Check if environment variables are loaded
    console.log('🔍 Checking environment variables...');
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.log('💡 Make sure your .env file exists in the project root');
      console.log('💡 Current working directory:', process.cwd());
      console.log('💡 Script directory:', __dirname);
      process.exit(1);
    }
    console.log('✅ MONGODB_URI found:', process.env.MONGODB_URI ? 'Yes' : 'No');

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check current state
    const totalPets = await Pet.countDocuments();
    console.log('📊 Total pets in database:', totalPets);

    if (totalPets === 0) {
      console.log('❌ No pets found in database!');
      process.exit(1);
    }

    // Get a sample pet to see what fields are missing
    const samplePet = await Pet.findOne();
    console.log('🔍 Sample pet structure:');
    console.log('- _id:', samplePet._id);
    console.log('- name:', samplePet.name);
    console.log('- type:', samplePet.type);
    console.log('- category:', samplePet.category || 'MISSING');
    console.log('- status:', samplePet.status || 'MISSING');
    console.log('- createdBy:', samplePet.createdBy || 'MISSING');
    console.log('- featured:', samplePet.featured || 'MISSING');

    // Find or create admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('👤 Creating admin user...');
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@furbabies.com',
        password: 'admin123',
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Admin user created');
    }

    // Count pets missing required fields
    const petsWithoutStatus = await Pet.countDocuments({ 
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: '' }
      ]
    });
    
    const petsWithoutCreatedBy = await Pet.countDocuments({ 
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    });

    const petsWithoutCategory = await Pet.countDocuments({ 
      $or: [
        { category: { $exists: false } },
        { category: null },
        { category: '' }
      ]
    });

    console.log(`🔧 Pets missing status: ${petsWithoutStatus}`);
    console.log(`🔧 Pets missing createdBy: ${petsWithoutCreatedBy}`);
    console.log(`🔧 Pets missing category: ${petsWithoutCategory}`);

    // Fix pets missing status field
    if (petsWithoutStatus > 0) {
      console.log('🔄 Adding status field to pets...');
      const result1 = await Pet.updateMany(
        { 
          $or: [
            { status: { $exists: false } },
            { status: null },
            { status: '' }
          ]
        },
        { $set: { status: 'available' } }
      );
      console.log(`✅ Added status to ${result1.modifiedCount} pets`);
    }

    // Fix pets missing createdBy field
    if (petsWithoutCreatedBy > 0) {
      console.log('🔄 Adding createdBy field to pets...');
      const result2 = await Pet.updateMany(
        { 
          $or: [
            { createdBy: { $exists: false } },
            { createdBy: null }
          ]
        },
        { $set: { createdBy: adminUser._id } }
      );
      console.log(`✅ Added createdBy to ${result2.modifiedCount} pets`);
    }

    // Fix pets missing category field (based on type)
    if (petsWithoutCategory > 0) {
      console.log('🔄 Adding category field based on type...');
      
      // Set category based on type
      await Pet.updateMany({ type: 'dog' }, { $set: { category: 'dog' } });
      await Pet.updateMany({ type: 'cat' }, { $set: { category: 'cat' } });
      await Pet.updateMany({ type: 'fish' }, { $set: { category: 'aquatic' } });
      await Pet.updateMany({ 
        type: { $in: ['bird', 'rabbit', 'hamster', 'other'] }
      }, { $set: { category: 'other' } });
      
      // For any remaining pets without category
      await Pet.updateMany(
        { 
          $or: [
            { category: { $exists: false } },
            { category: null },
            { category: '' }
          ]
        },
        { $set: { category: 'other' } }
      );
      
      console.log('✅ Added categories based on pet types');
    }

    // Set some pets as featured (randomly select about 20% of available pets)
    const availablePets = await Pet.countDocuments({ status: 'available' });
    const featuredCount = await Pet.countDocuments({ featured: true });
    
    console.log(`📊 Available pets: ${availablePets}`);
    console.log(`⭐ Currently featured: ${featuredCount}`);

    if (featuredCount < 6) {
      console.log('🔄 Setting some pets as featured...');
      const petsToFeature = Math.min(12, Math.ceil(availablePets * 0.2));
      
      await Pet.updateMany(
        { status: 'available', featured: { $ne: true } },
        { $set: { featured: true } },
        { limit: petsToFeature }
      );
      
      const newFeaturedCount = await Pet.countDocuments({ featured: true });
      console.log(`✅ Now have ${newFeaturedCount} featured pets`);
    }

    // Test the queries that your API uses
    console.log('\n🧪 Testing API queries...');

    // Test 1: All pets query
    const allPets = await Pet.find({}).limit(5);
    console.log(`✅ Basic query returned ${allPets.length} pets`);

    // Test 2: Available pets query
    const availablePetsQuery = await Pet.find({ status: 'available' }).limit(5);
    console.log(`✅ Available pets query returned ${availablePetsQuery.length} pets`);

    // Test 3: Featured pets aggregation (exactly what your API uses)
    const featuredPetsAgg = await Pet.aggregate([
      { $match: { status: 'available' } },
      { $sample: { size: 6 } }
    ]);
    console.log(`✅ Featured pets aggregation returned ${featuredPetsAgg.length} pets`);

    // Test 4: Featured pets with featured=true
    const featuredPetsQuery = await Pet.find({ 
      status: 'available', 
      featured: true 
    }).limit(6);
    console.log(`✅ Featured pets query returned ${featuredPetsQuery.length} pets`);

    if (featuredPetsAgg.length > 0) {
      console.log('\n🎉 SUCCESS! Your API queries should now work!');
      console.log('🐾 Sample pet names:', featuredPetsAgg.slice(0, 3).map(p => p.name).join(', '));
      console.log('🔄 Refresh your browser to see the changes.');
    } else {
      console.log('\n❌ Still having issues. Let\'s debug further...');
      
      // Debug: Check what status values exist
      const statusCounts = await Pet.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      console.log('📊 Status distribution:', statusCounts);
      
      // Debug: Check what types exist
      const typeCounts = await Pet.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);
      console.log('📊 Type distribution:', typeCounts);
    }

    console.log('\n✅ Fix complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
fixExistingPets();