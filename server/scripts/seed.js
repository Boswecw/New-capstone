const mongoose = require('mongoose');
const dotenv = require('dotenv');

console.log('🔧 Loading environment variables...');
dotenv.config();

console.log('📦 Loading models...');
const Pet = require('../models/Pet');
const User = require('../models/User');

console.log('🏗️  Models loaded successfully');

const pets = [
  {
    name: 'Golden Retriever Puppy',
    type: 'dog',
    breed: 'Golden Retriever',
    age: '8 weeks',
    price: 1200,
    description: 'Friendly, loyal, and great with families.',
    image: '/assets/GoldenRetriever.png',
    size: 'medium',
    gender: 'male',
    available: true,
    votes: { up: 15, down: 2 }
  },
  {
    name: 'British Short-Hair',
    type: 'cat',
    breed: 'British Shorthair',
    age: '2 years',
    price: 120,
    description: 'Gentle and loveable companion.',
    image: '/assets/CatA.png',
    size: 'medium',
    gender: 'female',
    available: true,
    votes: { up: 8, down: 1 }
  },
  {
    name: 'Betta Fish',
    type: 'fish',
    breed: 'Betta',
    age: '6 months',
    price: 12,
    description: 'Colorfully delightful aquatic companion.',
    image: '/assets/Betafish.jpg',
    size: 'small',
    available: true,
    votes: { up: 5, down: 0 }
  },
  {
    name: 'Colorful Parrot',
    type: 'bird',
    breed: 'Macaw',
    age: '1 year',
    price: 4000,
    description: 'Colorful and talkative, needs lots of love and attention.',
    image: '/assets/Parrot.png',
    size: 'large',
    gender: 'male',
    available: true,
    votes: { up: 12, down: 3 }
  },
  {
    name: 'Holland Lop Rabbit',
    type: 'small-pet',
    breed: 'Holland Lop',
    age: '4 months',
    price: 45,
    description: 'Fluffy and fun, perfect for kids.',
    image: '/assets/RabbitA.png',
    size: 'small',
    gender: 'female',
    available: true,
    votes: { up: 7, down: 1 }
  },
  {
    name: 'Guinea Pig',
    type: 'small-pet',
    breed: 'American Guinea Pig',
    age: '3 months',
    price: 35,
    description: 'Lively and social beginner pet.',
    image: '/assets/GuineaPigsLPicon.png',
    size: 'small',
    gender: 'male',
    available: true,
    votes: { up: 6, down: 0 }
  },
  {
    name: 'German Shepherd',
    type: 'dog',
    breed: 'German Shepherd',
    age: '1 year',
    price: 1200,
    description: 'Highly intelligent intensely active breed.',
    image: '/assets/german shepherd.png',
    size: 'large',
    gender: 'female',
    available: true,
    votes: { up: 20, down: 1 }
  },
  {
    name: 'Siamese Cat',
    type: 'cat',
    breed: 'Siamese',
    age: '6 months',
    price: 300,
    description: 'Talkative social and unique companion.',
    image: '/assets/Siamese.png',
    size: 'medium',
    gender: 'male',
    available: true,
    votes: { up: 9, down: 2 }
  },
  {
    name: 'Pet Bed',
    type: 'supply',
    breed: 'Comfort Bed',
    age: 'N/A',
    price: 65,
    description: 'Soft, cozy and easy to wash.',
    image: '/assets/PetBeds.png',
    available: true,
    votes: { up: 3, down: 0 }
  },
  {
    name: 'Premium Pet Food',
    type: 'supply',
    breed: 'Nutrition Plus',
    age: 'N/A',
    price: 30,
    description: 'Wholesome nutrition for furry friends.',
    image: '/assets/PetFoodLPicon.png',
    available: true,
    votes: { up: 4, down: 1 }
  }
];

const seedDatabase = async () => {
  try {
    console.log('🚀 Starting database seeding process...');
    
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

    // Create pets one by one
    console.log('🐾 Creating pets...');
    const createdPets = [];
    
    for (let i = 0; i < pets.length; i++) {
      const petData = pets[i];
      console.log(`📝 Creating pet ${i + 1}/${pets.length}: ${petData.name}`);
      
      try {
        const pet = new Pet({
          ...petData,
          createdBy: adminUser._id
        });
        
        const savedPet = await pet.save();
        createdPets.push(savedPet);
        console.log(`✅ Created: ${petData.name} (${petData.type})`);
      } catch (error) {
        console.error(`❌ Failed to create ${petData.name}:`, error.message);
        console.error('Pet data:', petData);
      }
    }

    console.log(`🎉 Successfully created ${createdPets.length} pets`);

    // Add sample ratings
    if (createdPets.length > 0) {
      console.log('⭐ Adding sample ratings...');
      for (let i = 0; i < Math.min(3, createdPets.length); i++) {
        const pet = createdPets[i];
        pet.ratings.push({
          user: testUser._id,
          rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
          comment: 'Great pet! Highly recommended.',
          createdAt: new Date()
        });
        await pet.save();
        console.log(`⭐ Added rating to: ${pet.name}`);
      }
      console.log('✅ Sample ratings added');
    }

    // Final summary
    const totalPets = await Pet.countDocuments();
    const totalUsers = await User.countDocuments();
    
    console.log('\n🎉 Database seeded successfully!');
    console.log(`📊 Final counts: ${totalPets} pets, ${totalUsers} users`);
    console.log('\n📝 Login credentials:');
    console.log('🔑 Admin: admin@furbabies.com / admin123');
    console.log('🔑 User: test@example.com / password123');
    
    mongoose.disconnect();
    console.log('👋 Disconnected from database');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Seeding failed with error:', error.message);
    console.error('Full error details:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

console.log('🌱 Initializing seed script...');
seedDatabase();