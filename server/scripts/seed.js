// server/scripts/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

console.log('🔧 Loading environment variables...');
dotenv.config();

console.log('📦 Loading models...');
const Pet = require('../models/Pet');
const User = require('../models/User');

console.log('🏗️  Models loaded successfully');

/**
 * Pet data with Google Cloud Storage image URLs
 * All images are now served from GCS bucket with proper organization
 */
const pets = [
  {
    name: 'Golden Retriever Puppy',
    type: 'dog',
    breed: 'Golden Retriever',
    age: '8 weeks',
    price: 1200,
    description: 'Friendly, loyal, and great with families. This adorable puppy loves to play and is perfect for active families.',
    image: 'pets/dogs/GoldenRetriever.png',
    size: 'medium',
    gender: 'male',
    available: true,
    votes: { up: 15, down: 2 },
    tags: ['family-friendly', 'active', 'loyal', 'puppy']
  },
  {
    name: 'British Short-Hair',
    type: 'cat',
    breed: 'British Shorthair',
    age: '2 years',
    price: 120,
    description: 'Gentle and loveable companion. Known for their calm demeanor and plush coat.',
    image: 'pets/cats/CatA.png',
    size: 'medium',
    gender: 'female',
    available: true,
    votes: { up: 8, down: 1 },
    tags: ['calm', 'indoor', 'gentle', 'low-maintenance']
  },
  {
    name: 'Betta Fish',
    type: 'fish',
    breed: 'Betta',
    age: '6 months',
    price: 12,
    description: 'Colorfully delightful aquatic companion. Easy to care for and stunning to watch.',
    image: 'pets/aquatics/Betafish.jpg',
    size: 'small',
    gender: 'male',
    available: true,
    votes: { up: 5, down: 0 },
    tags: ['colorful', 'easy-care', 'aquatic', 'beginner-friendly']
  },
  {
    name: 'Colorful Parrot',
    type: 'bird',
    breed: 'Macaw',
    age: '1 year',
    price: 4000,
    description: 'Colorful and talkative, needs lots of love and attention. Very intelligent and social bird.',
    image: 'pets/birds/Parrot.png',
    size: 'large',
    gender: 'male',
    available: true,
    votes: { up: 12, down: 3 },
    tags: ['intelligent', 'social', 'colorful', 'talkative', 'attention-needed']
  },
  {
    name: 'Holland Lop Rabbit',
    type: 'small-pet',
    breed: 'Holland Lop',
    age: '4 months',
    price: 45,
    description: 'Fluffy and fun, perfect for kids. Gentle nature and easy to handle.',
    image: 'pets/small-pets/RabbitA.png',
    size: 'small',
    gender: 'female',
    available: true,
    votes: { up: 7, down: 1 },
    tags: ['kid-friendly', 'gentle', 'fluffy', 'small-space']
  },
  {
    name: 'Guinea Pig',
    type: 'small-pet',
    breed: 'American Guinea Pig',
    age: '3 months',
    price: 35,
    description: 'Lively and social beginner pet. Great for children learning pet responsibility.',
    image: 'pets/small-pets/GuineaPigsLPicon.png',
    size: 'small',
    gender: 'male',
    available: true,
    votes: { up: 6, down: 0 },
    tags: ['beginner-friendly', 'social', 'kid-friendly', 'lively']
  },
  {
    name: 'German Shepherd',
    type: 'dog',
    breed: 'German Shepherd',
    age: '1 year',
    price: 1200,
    description: 'Highly intelligent intensely active breed. Excellent guard dog and family protector.',
    image: 'pets/dogs/german-shepherd.png',
    size: 'large',
    gender: 'female',
    available: true,
    votes: { up: 20, down: 1 },
    tags: ['intelligent', 'protective', 'active', 'loyal', 'guard-dog']
  },
  {
    name: 'Siamese Cat',
    type: 'cat',
    breed: 'Siamese',
    age: '6 months',
    price: 300,
    description: 'Talkative social and unique companion. Very interactive and bonds closely with owners.',
    image: 'pets/cats/Siamese.png',
    size: 'medium',
    gender: 'male',
    available: true,
    votes: { up: 9, down: 2 },
    tags: ['talkative', 'social', 'interactive', 'bonding']
  },
  // Pet supplies with GCS URLs
  {
    name: 'Premium Pet Bed',
    type: 'supply',
    breed: 'Comfort Bed',
    age: 'N/A',
    price: 65,
    description: 'Soft, cozy and easy to wash. Memory foam provides optimal comfort for your pet.',
    image: 'supplies/PetBeds.png',
    size: 'medium',
    available: true,
    votes: { up: 3, down: 0 },
    tags: ['comfort', 'washable', 'memory-foam', 'cozy']
  },
  {
    name: 'Premium Pet Food',
    type: 'supply',
    breed: 'Nutrition Plus',
    age: 'N/A',
    price: 30,
    description: 'Wholesome nutrition for furry friends. Made with natural ingredients and essential vitamins.',
    image: 'supplies/PetFoodLPicon.png',
    size: 'medium',
    available: true,
    votes: { up: 4, down: 1 },
    tags: ['nutritious', 'natural', 'vitamins', 'healthy']
  },
  {
    name: 'Interactive Pet Toys',
    type: 'supply',
    breed: 'Play Time',
    age: 'N/A',
    price: 25,
    description: 'Engaging toys to keep your pets active and mentally stimulated.',
    image: 'supplies/pet-toys.png',
    size: 'small',
    available: true,
    votes: { up: 8, down: 0 },
    tags: ['interactive', 'mental-stimulation', 'active', 'fun']
  },
  {
    name: 'Adjustable Pet Collar',
    type: 'supply',
    breed: 'Safety First',
    age: 'N/A',
    price: 18,
    description: 'Durable and comfortable collar with safety buckle and ID tag attachment.',
    image: 'supplies/pet-collars.png',
    size: 'small',
    available: true,
    votes: { up: 5, down: 0 },
    tags: ['safety', 'durable', 'comfortable', 'adjustable']
  }
];

const seedDatabase = async () => {
  try {
    console.log('🚀 Starting database seeding process...');
    
    // Validate environment variables
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database name:', mongoose.connection.name);

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    const deletedPets = await Pet.deleteMany({});
    const deletedUsers = await User.deleteMany({});
    console.log(`🗑️  Deleted ${deletedPets.deletedCount} pets and ${deletedUsers.deletedCount} users`);

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = new User({
      username: 'admin',
      email: 'admin@furbabies.com',
      password: 'admin123',
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      }
    });
    await adminUser.save();
    console.log('✅ Admin user created:', adminUser.email);

    // Create test user
    console.log('👤 Creating test user...');
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      }
    });
    await testUser.save();
    console.log('✅ Test user created:', testUser.email);

    // Create pets one by one with enhanced error handling
    console.log('🐾 Creating pets...');
    const createdPets = [];
    
    for (let i = 0; i < pets.length; i++) {
      const petData = pets[i];
      console.log(`📝 Creating pet ${i + 1}/${pets.length}: ${petData.name}`);
      
      try {
        const pet = new Pet({
          ...petData,
          createdBy: adminUser._id,
          // Add metadata for GCS images
          imageMetadata: {
            bucket: process.env.GCS_BUCKET_NAME || 'furbabies-images',
            originalPath: petData.image,
            sizes: ['thumbnail', 'small', 'medium', 'large'],
            uploadedAt: new Date()
          }
        });
        
        const savedPet = await pet.save();
        createdPets.push(savedPet);
        console.log(`✅ Created: ${petData.name} (${petData.type}) - Image: ${petData.image}`);
      } catch (error) {
        console.error(`❌ Failed to create ${petData.name}:`, error.message);
        console.error('Pet data:', JSON.stringify(petData, null, 2));
      }
    }

    console.log(`🎉 Successfully created ${createdPets.length} pets`);

    // Add sample ratings and reviews
    if (createdPets.length > 0) {
      console.log('⭐ Adding sample ratings and reviews...');
      
      const sampleReviews = [
        'Absolutely wonderful pet! Highly recommended.',
        'Great quality and exactly as described.',
        'Perfect addition to our family!',
        'Excellent customer service and healthy pet.',
        'Very happy with our purchase.'
      ];
      
      for (let i = 0; i < Math.min(5, createdPets.length); i++) {
        const pet = createdPets[i];
        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
        const comment = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
        
        pet.ratings.push({
          user: testUser._id,
          rating: rating,
          comment: comment,
          createdAt: new Date()
        });
        
        await pet.save();
        console.log(`⭐ Added ${rating}-star rating to ${pet.name}`);
      }
    }

    // Display summary
    console.log('\n📊 SEEDING SUMMARY:');
    console.log(`👥 Users created: 2 (1 admin, 1 test user)`);
    console.log(`🐾 Pets created: ${createdPets.length}`);
    console.log(`🖼️  All images configured for Google Cloud Storage`);
    console.log(`📱 Sample ratings added to ${Math.min(5, createdPets.length)} pets`);
    
    // Log GCS configuration info
    console.log('\n🪣 GCS Configuration:');
    console.log(`Bucket: ${process.env.GCS_BUCKET_NAME || 'furbabies-images'}`);
    console.log(`Base URL: https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME || 'furbabies-images'}`);
    
    console.log('\n✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
};

// Run the seeding function
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🏁 Seeding process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase, pets };