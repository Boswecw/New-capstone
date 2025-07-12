// server/safeDataBooster.js - ABSOLUTELY NO DELETION, ONLY ADDITIONS
const mongoose = require('mongoose');
require('dotenv').config();

const safeBoost = async () => {
  try {
    console.log('🚀 Safe data boosting (zero deletion policy)...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import models
    const User = require('./models/User');
    const Pet = require('./models/Pet');
    const Contact = require('./models/Contact');

    // Count existing data
    const existingUsers = await User.countDocuments();
    const existingPets = await Pet.countDocuments();
    const existingContacts = await Contact.countDocuments();
    
    console.log('📊 Current data:');
    console.log(`   Users: ${existingUsers}`);
    console.log(`   Pets: ${existingPets}`);
    console.log(`   Contacts: ${existingContacts}`);

    // Ensure admin exists (safe check)
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@furbabies.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
      });
      console.log('👤 Created admin user');
    }

    // Add some users for variety (minimum viable amount)
    const usersToAdd = Math.max(0, 5 - existingUsers);
    if (usersToAdd > 0) {
      const newUsers = [];
      for (let i = 0; i < usersToAdd; i++) {
        const daysAgo = Math.floor(Math.random() * 30) + 10; // 10-40 days ago
        newUsers.push({
          name: `Sample User ${existingUsers + i + 1}`,
          email: `sample${existingUsers + i + 1}@test.com`,
          password: 'password123',
          role: 'user',
          isActive: true,
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        });
      }
      await User.create(newUsers);
      console.log(`➕ Added ${usersToAdd} users for analytics data`);
    }

    // Add some pets if needed (minimum for analytics)
    const petsToAdd = Math.max(0, 8 - existingPets);
    if (petsToAdd > 0) {
      const newPets = [];
      const petTypes = [
        { type: 'dog', category: 'dog', breed: 'Mixed Breed' },
        { type: 'cat', category: 'cat', breed: 'Domestic Shorthair' },
        { type: 'fish', category: 'aquatic', breed: 'Goldfish' }
      ];
      
      for (let i = 0; i < petsToAdd; i++) {
        const daysAgo = Math.floor(Math.random() * 60) + 5; // 5-65 days ago
        const petInfo = petTypes[i % 3];
        const isAdopted = i < 2; // Make first 2 adopted for variety
        
        newPets.push({
          name: `Sample ${petInfo.type} ${existingPets + i + 1}`,
          type: petInfo.type,
          category: petInfo.category,
          breed: petInfo.breed,
          age: Math.floor(Math.random() * 8) + 1,
          gender: Math.random() > 0.5 ? 'male' : 'female',
          size: 'medium',
          color: 'Various',
          description: `A wonderful ${petInfo.type} looking for a loving home.`,
          imageUrl: `/images/pets/sample-${petInfo.type}.jpg`,
          status: isAdopted ? 'adopted' : 'available',
          adoptionFee: Math.floor(Math.random() * 150) + 50,
          location: {
            shelter: 'Sample Shelter',
            city: 'Louisville',
            state: 'KY'
          },
          contactInfo: {
            email: 'sample@shelter.com',
            phone: '+1-555-SAMPLE'
          },
          views: Math.floor(Math.random() * 25) + 5,
          favorites: Math.floor(Math.random() * 8),
          adoptedAt: isAdopted ? new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000) : null,
          createdBy: admin._id,
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        });
      }
      await Pet.create(newPets);
      console.log(`➕ Added ${petsToAdd} pets for analytics data`);
    }

    // Add some contacts if needed (minimum for analytics)
    const contactsToAdd = Math.max(0, 5 - existingContacts);
    if (contactsToAdd > 0) {
      const newContacts = [];
      const statuses = ['new', 'read', 'responded'];
      
      for (let i = 0; i < contactsToAdd; i++) {
        const daysAgo = Math.floor(Math.random() * 30) + 1; // 1-31 days ago
        
        newContacts.push({
          name: `Sample Contact ${existingContacts + i + 1}`,
          email: `sample${existingContacts + i + 1}@test.com`,
          subject: `Sample Inquiry ${existingContacts + i + 1}`,
          message: `This is a sample message for analytics purposes.`,
          status: statuses[i % 3],
          priority: 'medium',
          category: 'general',
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        });
      }
      await Contact.create(newContacts);
      console.log(`➕ Added ${contactsToAdd} contacts for analytics data`);
    }

    // Final verification
    const finalUsers = await User.countDocuments();
    const finalPets = await Pet.countDocuments();
    const finalContacts = await Contact.countDocuments();
    
    console.log('✅ Safe boost completed!');
    console.log('📈 Final totals:');
    console.log(`   Users: ${finalUsers} (was ${existingUsers})`);
    console.log(`   Pets: ${finalPets} (was ${existingPets})`);
    console.log(`   Contacts: ${finalContacts} (was ${existingContacts})`);
    console.log('🛡️ Zero deletions performed - all existing data preserved');
    
  } catch (error) {
    console.error('❌ Safe boost error:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  safeBoost();
}

module.exports = { safeBoost };