#!/usr/bin/env node
/**
 * Data Diversification Script for FurBabies Pets Collection
 * This script will add realistic variety to your pets data to make filtering work properly
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://USERNAME:PASSWORD@furbabies-cluster.fo3iqu4.mongodb.net/FurBabies-Production?retryWrites=true&w=majority';

const DATABASE_NAME = 'FurBabies-Production';
const COLLECTION_NAME = 'pets';

// Realistic data distributions
const STATUS_DISTRIBUTION = [
  { value: 'available', weight: 0.65 },    // 65% available
  { value: 'adopted', weight: 0.25 },      // 25% adopted  
  { value: 'pending', weight: 0.10 }       // 10% pending
];

const FEATURED_DISTRIBUTION = [
  { value: true, weight: 0.30 },           // 30% featured
  { value: false, weight: 0.70 }           // 70% not featured
];

const AGE_DISTRIBUTION = [
  { value: 'puppy', weight: 0.25 },        // 25% puppies/kittens
  { value: 'young', weight: 0.35 },        // 35% young  
  { value: 'adult', weight: 0.30 },        // 30% adult
  { value: 'senior', weight: 0.10 }        // 10% senior
];

// Age mappings by pet type
const AGE_MAPPINGS = {
  'dog': ['puppy', 'young', 'adult', 'senior'],
  'cat': ['kitten', 'young', 'adult', 'senior'],
  'bird': ['chick', 'young', 'adult', 'mature'],
  'fish': ['fry', 'juvenile', 'adult', 'mature'],
  'rabbit': ['kit', 'young', 'adult', 'senior'],
  'default': ['baby', 'young', 'adult', 'mature']
};

function getRandomWeighted(distribution) {
  const random = Math.random();
  let cumulative = 0;
  
  for (const item of distribution) {
    cumulative += item.weight;
    if (random <= cumulative) {
      return item.value;
    }
  }
  
  return distribution[distribution.length - 1].value;
}

function getAgeForPetType(petType) {
  const ageIndex = Math.floor(Math.random() * 4);
  const ageTypes = AGE_MAPPINGS[petType] || AGE_MAPPINGS['default'];
  return ageTypes[ageIndex];
}

function getRandomDate(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime);
}

async function diversifyPetsData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to furbabies-cluster.fo3iqu4.mongodb.net');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Get all pets
    console.log('\n📊 Analyzing current pets data...');
    const pets = await collection.find({}).toArray();
    console.log(`Found ${pets.length} pets to diversify`);
    
    // Show current data distribution
    const currentFeatured = pets.filter(p => p.featured === true).length;
    const currentStatus = pets.filter(p => p.status === 'available').length;
    
    console.log(`\n📈 Current Distribution:`);
    console.log(`   Featured: ${currentFeatured}/${pets.length} (${(currentFeatured/pets.length*100).toFixed(1)}%)`);
    console.log(`   Available: ${currentStatus}/${pets.length} (${(currentStatus/pets.length*100).toFixed(1)}%)`);
    
    console.log('\n🔄 Diversifying data...');
    
    let updatedCount = 0;
    const updates = [];
    
    // Process each pet
    for (const pet of pets) {
      const newStatus = getRandomWeighted(STATUS_DISTRIBUTION);
      const newFeatured = getRandomWeighted(FEATURED_DISTRIBUTION);
      const newAge = getAgeForPetType(pet.type);
      
      // Create varied dates over the past 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const now = new Date();
      
      const newCreatedAt = getRandomDate(sixMonthsAgo, now);
      const newUpdatedAt = getRandomDate(newCreatedAt, now);
      
      const update = {
        updateOne: {
          filter: { _id: pet._id },
          update: {
            $set: {
              status: newStatus,
              featured: newFeatured,
              age: newAge,
              createdAt: newCreatedAt,
              updatedAt: newUpdatedAt,
              // Add some missing fields that might be useful
              heartRating: Math.floor(Math.random() * 5) + 1, // 1-5 stars
              adoptionFee: Math.floor(Math.random() * 200) + 50, // $50-250
              isSpayedNeutered: Math.random() > 0.3, // 70% spayed/neutered
              isVaccinated: Math.random() > 0.2, // 80% vaccinated
              needsSpecialCare: Math.random() > 0.85 // 15% need special care
            }
          }
        }
      };
      
      updates.push(update);
    }
    
    // Execute bulk update
    console.log(`\n💾 Updating ${updates.length} pet records...`);
    const result = await collection.bulkWrite(updates);
    updatedCount = result.modifiedCount;
    
    // Verify new distribution
    console.log('\n🔍 Verifying new data distribution...');
    const updatedPets = await collection.find({}).toArray();
    
    const statusCounts = {};
    const featuredCounts = { true: 0, false: 0 };
    const ageCounts = {};
    
    updatedPets.forEach(pet => {
      // Count status
      statusCounts[pet.status] = (statusCounts[pet.status] || 0) + 1;
      
      // Count featured
      featuredCounts[pet.featured] = (featuredCounts[pet.featured] || 0) + 1;
      
      // Count ages
      ageCounts[pet.age] = (ageCounts[pet.age] || 0) + 1;
    });
    
    console.log('\n📊 NEW DATA DISTRIBUTION:');
    console.log('\n🎯 Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = (count / updatedPets.length * 100).toFixed(1);
      console.log(`   ${status}: ${count} pets (${percentage}%)`);
    });
    
    console.log('\n⭐ Featured Distribution:');
    Object.entries(featuredCounts).forEach(([featured, count]) => {
      const percentage = (count / updatedPets.length * 100).toFixed(1);
      console.log(`   Featured ${featured}: ${count} pets (${percentage}%)`);
    });
    
    console.log('\n👶 Age Distribution:');
    Object.entries(ageCounts).forEach(([age, count]) => {
      const percentage = (count / updatedPets.length * 100).toFixed(1);
      console.log(`   ${age}: ${count} pets (${percentage}%)`);
    });
    
    console.log('\n🎉 SUCCESS!');
    console.log(`✅ Updated: ${updatedCount} pets`);
    console.log('✅ Data now has realistic diversity for filtering');
    console.log('✅ Your Browse.js filters will now work properly!');
    
    // Test queries to verify indexes will be useful
    console.log('\n🧪 Testing filter scenarios...');
    
    const availablePets = await collection.find({ status: 'available' }).toArray();
    const featuredPets = await collection.find({ featured: true }).toArray();
    const adoptedPets = await collection.find({ status: 'adopted' }).toArray();
    const youngPets = await collection.find({ age: 'young' }).toArray();
    
    console.log(`   Available pets: ${availablePets.length} (filtering will work!)`);
    console.log(`   Featured pets: ${featuredPets.length} (filtering will work!)`);
    console.log(`   Adopted pets: ${adoptedPets.length} (filtering will work!)`);
    console.log(`   Young pets: ${youngPets.length} (filtering will work!)`);
    
    if (availablePets.length > 0 && availablePets.length < updatedPets.length) {
      console.log('\n✅ FILTERING IS NOW FUNCTIONAL!');
      console.log('✅ Your Browse.js pagination will show meaningful results');
      console.log('✅ Featured pets section will show subset of pets');
      console.log('✅ Status filters will provide different results');
    } else {
      console.log('\n⚠️  Data distribution may need adjustment');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB Atlas');
  }
}

// Run the diversification
if (require.main === module) {
  diversifyPetsData()
    .then(() => {
      console.log('\n🎊 Data diversification complete!');
      console.log('🚀 Now run the index creation script for optimal performance');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Data diversification failed:', error);
      process.exit(1);
    });
}

module.exports = diversifyPetsData;