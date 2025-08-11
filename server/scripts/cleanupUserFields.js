const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const User = require('../models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const usernameResult = await User.updateMany(
      { username: { $exists: true }, name: { $exists: false } },
      { $rename: { username: 'name' } }
    );

    const favoritesResult = await User.updateMany(
      { favoritesPets: { $exists: true }, favorites: { $exists: false } },
      { $rename: { favoritesPets: 'favorites' } }
    );

    console.log('User field migration complete:', {
      renamedUsernames: usernameResult.modifiedCount,
      renamedFavorites: favoritesResult.modifiedCount
    });
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
