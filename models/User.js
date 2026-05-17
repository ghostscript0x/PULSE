const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, sparse: true },
    password: { type: String },
    // Stacks Wallet Authentication
    walletAddress: { type: String, unique: true, sparse: true },
    walletType: { type: String, enum: ['hiro', 'leather', 'xverse', 'generic'], default: 'generic' },
    isWalletAuth: { type: Boolean, default: false },
    // Profile from wallet
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

// Ensure either username/password or walletAddress is present
userSchema.pre('save', function(next) {
    if (!this.username && !this.walletAddress) {
        const err = new Error('Either username or wallet address is required');
        return next(err);
    }
    if (this.username && !this.password && !this.isWalletAuth) {
        const err = new Error('Password is required for username authentication');
        return next(err);
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
