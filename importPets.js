const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Pet = require('./models/Pet');

// Load environment variables
dotenv.config();

// MongoDB connection
connectDB();

// Import pets
const importPets = async () => {
  try {
    const filePath = path.join(__dirname, 'data', 'generated_pets.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const pets = JSON.parse(data);

    // Optional: clear existing pets
    // await Pet.deleteMany({});

    // Add createdBy and default fields
    const DEFAULT_USER_ID = '64f7e0fefebcd1234567890a'; // Replace with a real user ID
    const petsWithOwner = pets.map(p => ({
      ...p,
      category: p.type === 'fish' ? 'aquatic' : ['dog', 'cat'].includes(p.type) ? p.type : 'other',
      createdBy: DEFAULT_USER_ID,
      status: 'available'
    }));

    await Pet.insertMany(petsWithOwner, { ordered: false });
    console.log(`✅ Successfully imported ${pets.length} pets`);
    process.exit();
  } catch (error) {
    console.error('❌ Error importing pets:', error.message);
    process.exit(1);
  }
};

importPets();
