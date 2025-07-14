// scripts/testApiQueries.js - Test the exact queries your frontend makes
const mongoose = require('mongoose');
require('dotenv').config();

const Pet = require('../server/models/Pet');
const Product = require('../server/models/Product');

const testApiQueries = async () => {
  try {
    console.log('🧪 TESTING API QUERIES...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // ============================================
    // TEST 1: Home Page Pets Query
    // ============================================
    console.log('🐕 TEST 1: Home Page Pets Query');
    console.log('   Frontend calls: GET /pets?featured=true&limit=4');
    
    const query1 = { featured: true };
    const homePets = await Pet.find(query1).limit(4).lean();
    
    console.log(`   📊 Query: ${JSON.stringify(query1)}`);
    console.log(`   ✅ Results: ${homePets.length} pets found`);
    
    if (homePets.length > 0) {
      console.log('   📝 Sample results:');
      homePets.forEach((pet, index) => {
        console.log(`      ${index + 1}. ${pet.name} (${pet.type}) - Featured: ${pet.featured}, Status: ${pet.status}`);
        console.log(`         Image: ${pet.image}`);
        console.log(`         Full URL: https://storage.googleapis.com/furbabies-petstore/${pet.image}`);
      });
    } else {
      console.log('   ❌ No featured pets found!');
      
      // Check how many pets have featured=true
      const totalFeatured = await Pet.countDocuments({ featured: true });
      const totalPets = await Pet.countDocuments();
      console.log(`   📊 Total pets with featured=true: ${totalFeatured}`);
      console.log(`   📊 Total pets in database: ${totalPets}`);
      
      if (totalPets > 0 && totalFeatured === 0) {
        console.log('   💡 SOLUTION: Run "npm run fix-fields" to add featured fields');
      }
    }
    console.log('');

    // ============================================
    // TEST 2: Home Page Products Query  
    // ============================================
    console.log('🛍️  TEST 2: Home Page Products Query');
    console.log('   Frontend calls: GET /products?limit=4&inStock=true');
    
    const query2 = { inStock: true };
    const homeProducts = await Product.find(query2).limit(4).lean();
    
    console.log(`   📊 Query: ${JSON.stringify(query2)}`);
    console.log(`   ✅ Results: ${homeProducts.length} products found`);
    
    if (homeProducts.length > 0) {
      console.log('   📝 Sample results:');
      homeProducts.forEach((product, index) => {
        console.log(`      ${index + 1}. ${product.name} - InStock: ${product.inStock}, Featured: ${product.featured}`);
        console.log(`         Image: ${product.image}`);
        console.log(`         Full URL: https://storage.googleapis.com/furbabies-petstore/${product.image}`);
      });
    } else {
      console.log('   ❌ No in-stock products found!');
      
      // Check how many products have inStock=true
      const totalInStock = await Product.countDocuments({ inStock: true });
      const totalProducts = await Product.countDocuments();
      console.log(`   📊 Total products with inStock=true: ${totalInStock}`);
      console.log(`   📊 Total products in database: ${totalProducts}`);
      
      if (totalProducts > 0 && totalInStock === 0) {
        console.log('   💡 SOLUTION: Run "npm run fix-fields" to add inStock fields');
      }
    }
    console.log('');

    // ============================================
    // TEST 3: API Response Structure Test
    // ============================================
    console.log('🔧 TEST 3: API Response Structure');
    
    // Simulate what your API route should return
    const apiResponse = {
      success: true,
      data: homePets.map(pet => ({
        ...pet,
        imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
        hasImage: !!pet.image,
        displayName: pet.name || 'Unnamed Pet',
        isAvailable: pet.status === 'available'
      })),
      count: homePets.length,
      message: `Found ${homePets.length} featured pets`
    };
    
    console.log('   📊 API Response Structure:');
    console.log(`      success: ${apiResponse.success}`);
    console.log(`      data.length: ${apiResponse.data.length}`);
    console.log(`      count: ${apiResponse.count}`);
    console.log(`      message: "${apiResponse.message}"`);
    
    if (apiResponse.data.length > 0) {
      console.log('   📝 Sample data item structure:');
      const sampleItem = apiResponse.data[0];
      console.log(`      Keys: ${Object.keys(sampleItem).join(', ')}`);
      console.log(`      Has imageUrl: ${!!sampleItem.imageUrl}`);
      console.log(`      Has displayName: ${!!sampleItem.displayName}`);
    }
    console.log('');

    // ============================================
    // TEST 4: Database Collections Check
    // ============================================
    console.log('📦 TEST 4: Database Collections Check');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('   Available collections:');
    collections.forEach(col => {
      console.log(`      - ${col.name}`);
    });
    
    const hasPets = collections.some(c => c.name === 'pets');
    const hasProducts = collections.some(c => c.name === 'products');
    
    console.log(`   ✅ pets collection: ${hasPets ? 'EXISTS' : 'MISSING'}`);
    console.log(`   ✅ products collection: ${hasProducts ? 'EXISTS' : 'MISSING'}`);
    console.log('');

    // ============================================
    // SUMMARY & RECOMMENDATIONS
    // ============================================
    console.log('📋 SUMMARY & RECOMMENDATIONS:');
    
    const petQueryWorks = homePets.length > 0;
    const productQueryWorks = homeProducts.length > 0;
    
    if (petQueryWorks && productQueryWorks) {
      console.log('   🎉 SUCCESS! Both queries return data.');
      console.log('   🔧 Next step: Replace server.js with the fixed version to use real routes.');
      console.log('   🚀 After deployment, your homepage should show data!');
    } else {
      console.log('   ⚠️  Issues found:');
      if (!petQueryWorks) {
        console.log('      - Pets query returns no results');
        console.log('      - Check featured field in pets collection');
      }
      if (!productQueryWorks) {
        console.log('      - Products query returns no results');
        console.log('      - Check inStock field in products collection');
      }
      console.log('   💡 Run "npm run fix-fields" to resolve these issues');
    }

    console.log('\n✅ API query testing completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ API query testing failed:', error);
    process.exit(1);
  }
};

// Run the tests
testApiQueries();