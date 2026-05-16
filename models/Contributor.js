const mongoose = require('mongoose');

const contributorSchema = new mongoose.Schema({
    walletId: { type: String, required: true, unique: true },
    reputationScore: { type: Number, default: 0 },
    activityLog: [{
        action: String,
        timestamp: { type: Date, default: Date.now }
    }],
    lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contributor', contributorSchema);
