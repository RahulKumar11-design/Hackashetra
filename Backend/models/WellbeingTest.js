const mongoose = require('mongoose');

const wellbeingTestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    testType: {
        type: String,
        required: true,
        enum: ['cvd', 'stroke', 'depression', 'anxiety', 'hypertension', 'diabetes']
    },
    answers: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        required: true
    },
    result: {
        riskLevel: {
            type: String,
            enum: ['low', 'moderate', 'high'],
            required: true
        },
        recommendations: [{
            type: String
        }],
        score: Number
    },
    testDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
wellbeingTestSchema.index({ user: 1, testDate: -1 });
wellbeingTestSchema.index({ user: 1, testType: 1 });

module.exports = mongoose.model('WellbeingTest', wellbeingTestSchema); 