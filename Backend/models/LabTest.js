// models/LabTest.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const labTestSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testName: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true,
    maxlength: [100, 'Test name cannot be more than 100 characters']
  },
  labName: {
    type: String,
    required: [true, 'Lab name is required'],
    trim: true,
    maxlength: [100, 'Lab name cannot be more than 100 characters']
  },
  testDate: {
    type: Date,
    required: [true, 'Test date is required'],
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Test date cannot be in the future'
    }
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries
labTestSchema.index({ user: 1, testDate: -1 });

// Clean up file when document is removed
labTestSchema.pre('remove', async function(next) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const filePath = path.join(__dirname, '..', this.fileUrl);
    await fs.unlink(filePath);
    next();
  } catch (error) {
    console.error('Error deleting file:', error);
    next();
  }
});

module.exports = mongoose.model('LabTest', labTestSchema);