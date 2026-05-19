const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Wallet address is the primary identifier
    walletAddress: { type: String, required: true, unique: true },
    walletType: { type: String, enum: ['metamask', 'trustwallet', 'coinbase', 'brave', 'generic'], default: 'generic' },
    isWalletAuth: { type: Boolean, default: true },
    // Custom username
    username: { type: String, unique: true, sparse: true },
    // Profile - using wallet address as display name by default
    profile: {
        name: String,
        avatar: String
    },
    followedDaos: [{
        daoId: String,
        name: String,
        addedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

// Auto-generate name from wallet address if not provided
userSchema.pre('save', function(next) {
    if (this.isWalletAuth && this.walletAddress && !this.profile.name && !this.username) {
        this.profile.name = `0x${this.walletAddress.substring(2, 10)}`;
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
