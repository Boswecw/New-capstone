require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');

const filePath = path.join(__dirname, 'data', 'generated_products.json');

const importProducts = async () => {
  try {
    await connectDB();

    const data = fs.readFileSync(filePath, 'utf-8');
    const products = JSON.parse(data);

    await Product.deleteMany();
    await Product.insertMany(products);

    console.log(`✅ Successfully imported ${products.length} products`);
    process.exit();
  } catch (err) {
    console.error('❌ Error importing products:', err.message);
    process.exit(1);
  }
};

importProducts();
