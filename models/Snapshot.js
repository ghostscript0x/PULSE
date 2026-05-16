const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
    daoId: { type: String, required: true }, // Changed to String to match external API IDs
    timestamp: { type: Date, default: Date.now },
    healthScore: { type: mongoose.Schema.Types.Mixed, required: true }, // Number or "INSUFFICIENT_DATA"
    metrics: {
        velocity: Number,
        completionRate: Number,
        retention: Number,
        reputationGrowth: Number,
        diversity: Number
    },
    rawLiveData: { type: Object, required: true } // Storing exact API response
});

module.exports = mongoose.model('Snapshot', snapshotSchema);
