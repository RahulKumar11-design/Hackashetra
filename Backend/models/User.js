// models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // Basic auth information
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Personal information
  name: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  phoneNumber: { type: String },
  
  // Medical information
  bloodGroup: { type: String },
  allergies: [String],
  chronicConditions: [String],
  
  // Address/location for emergency services
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String }
  },
  xray:{ type: String }
});

module.exports = mongoose.model('User', UserSchema);