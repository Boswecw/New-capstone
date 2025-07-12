// server/models/Settings.js
const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Pet Adoption Center' },
  siteDescription: { type: String, default: 'Find your perfect pet companion' },
  emailNotifications: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  maxUploadSize: { type: String, default: '5MB' },
  allowRegistration: { type: Boolean, default: true },
  requireEmailVerification: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', SettingsSchema);
