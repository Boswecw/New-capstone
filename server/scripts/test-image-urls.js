// test-image-urls.js
/**
 * Test script to validate image URLs from your MongoDB data
 * Run with: node test-image-urls.js
 */

const https = require('https');

// Sample data from your MongoDB exports
const testData = {
  pets: [
    { name: 'pet 2', image: 'pet/black-gold-fish.png' },
    { name: 'oscar', image: 'pet/tabby-cat.png' },
    { name: 'nova', image: 'pet/dog-a.png' },
    { name: 'pet 34', image: 'pet/purple-fish.jpg' },
    { name: 'james', image: 'pet/saint-bernard-pup.png' },
    { name: 'gala', image: 'pet/tiger-cat.png' }
  ],
  products: [
    { name: 'Interactive Cat Toy', image: 'product/interactive-cat-toy.png' },
    { name: 'Medium Fish Tank', image: 'product/medium-fish-tank.png' },
    { name: 'Clicker', image: 'product/clicker.png' },
    { name: 'Dog Harness', image: 'product/dog-harness.png' },
    { name: 'Kibble Dog Food', image: 'product/kibble-dog-food.png' }
  ]
};

// GCS base URL
const GCS_BASE_URL = 'https://storage.googleapis.com/furbabies-petstore';

/**
 * Build URL without encoding (correct approach)
 */
function buildCorrectUrl(imagePath) {
  if (!imagePath) return null;
  const cleaned = imagePath.trim().replace(/^\/+/, '');
  return `${GCS_BASE_URL}/${cleaned}`;
}

/**
 * Build URL with encoding (incorrect approach - for comparison)
 */
function buildIncorrectUrl(imagePath) {
  if (!imagePath) return null;
  const parts = imagePath.split('/');
  const encoded = parts.map(part => encodeURIComponent(part)).join('/');
  return `${GCS_BASE_URL}/${encoded}`;
}

/**
 * Test if URL is accessible
 */
function testUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        success: res.statusCode === 200
      });
    }).on('error', (err) => {
      resolve({
        url,
        status: 0,
        success: false,
        error: err.message
      });
    });
  });
}

/**
 * Run validation tests
 */
async function runTests() {
  console.log('🔍 FurBabies Image URL Validation Test');
  console.log('=' .repeat(60));
  
  // Test Pets
  console.log('\n📦 TESTING PET IMAGES:');
  console.log('-'.repeat(40));
  
  for (const pet of testData.pets) {
    const correctUrl = buildCorrectUrl(pet.image);
    const incorrectUrl = buildIncorrectUrl(pet.image);
    
    console.log(`\n🐾 ${pet.name}:`);
    console.log(`   Path: ${pet.image}`);
    
    // Test correct URL
    const correctResult = await testUrl(correctUrl);
    console.log(`   ✅ Correct URL: ${correctResult.url}`);
    console.log(`      Status: ${correctResult.status} ${correctResult.success ? '✓' : '✗'}`);
    
    // Test incorrect URL (if different)
    if (correctUrl !== incorrectUrl) {
      const incorrectResult = await testUrl(incorrectUrl);
      console.log(`   ❌ Encoded URL: ${incorrectResult.url}`);
      console.log(`      Status: ${incorrectResult.status} ${incorrectResult.success ? '✓' : '✗'}`);
    }
  }
  
  // Test Products
  console.log('\n\n📦 TESTING PRODUCT IMAGES:');
  console.log('-'.repeat(40));
  
  for (const product of testData.products) {
    const correctUrl = buildCorrectUrl(product.image);
    const incorrectResult = buildIncorrectUrl(product.image);
    
    console.log(`\n🛍️ ${product.name}:`);
    console.log(`   Path: ${product.image}`);
    
    // Test correct URL
    const correctResult = await testUrl(correctUrl);
    console.log(`   ✅ Correct URL: ${correctResult.url}`);
    console.log(`      Status: ${correctResult.status} ${correctResult.success ? '✓' : '✗'}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY:');
  console.log('-'.repeat(40));
  
  const allTests = [...testData.pets, ...testData.products];
  let successCount = 0;
  let failureCount = 0;
  
  for (const item of allTests) {
    const url = buildCorrectUrl(item.image);
    const result = await testUrl(url);
    if (result.success) successCount++;
    else failureCount++;
  }
  
  console.log(`✅ Successful: ${successCount}/${allTests.length}`);
  console.log(`❌ Failed: ${failureCount}/${allTests.length}`);
  console.log(`📈 Success Rate: ${((successCount / allTests.length) * 100).toFixed(1)}%`);
  
  // Example URLs for manual verification
  console.log('\n📝 EXAMPLE URLS FOR MANUAL VERIFICATION:');
  console.log('-'.repeat(40));
  console.log('Pet URL:', buildCorrectUrl('pet/black-gold-fish.png'));
  console.log('Product URL:', buildCorrectUrl('product/interactive-cat-toy.png'));
  
  console.log('\n✨ Test complete!\n');
}

// Run the tests
runTests().catch(console.error);