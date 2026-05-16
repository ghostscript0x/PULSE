const mongoose = require('mongoose');

const bountySchema = new mongoose.Schema({
    bountyId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['open', 'completed', 'failed', 'expired'], default: 'open' },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    participants: [String],
    engagementScore: { type: Number, default: 0 }
});

module.exports = mongoose.model('Bounty', bountySchema);
