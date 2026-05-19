const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const crypto = require('crypto');

// Generate a unique challenge for wallet authentication
function generateChallenge() {
    return crypto.randomBytes(32).toString('hex');
}

// EVM wallet authentication message template
function createAuthMessage(challenge, domain) {
    return `PULSE Authentication\n\nChallenge: ${challenge}\n\nSign this message to authenticate with PULSE.\n\nDomain: ${domain}\nNonce: ${challenge}`;
}

exports.getLogin = (req, res) => res.render('login', { title: 'PULSE | Login' });
exports.getRegister = (req, res) => res.render('register', { title: 'PULSE | Register' });

// Generate authentication challenge for wallet
exports.walletAuthChallenge = async (req, res) => {
    try {
        const challenge = generateChallenge();
        const domain = req.get('origin') || `http://localhost:${process.env.PORT || 3000}`;

        // Store the full message in session for verification
        const authMessage = createAuthMessage(challenge, domain);
        
        req.session.walletChallenge = {
            challenge,
            message: authMessage,
            createdAt: Date.now()
        };

        res.json({
            success: true,
            challenge,
            message: authMessage,
            domain
        });
    } catch (error) {
        console.error('Wallet auth challenge error:', error);
        res.status(500).json({ success: false, error: 'AUTH_CHALLENGE_FAILED' });
    }
};

// Verify wallet signature and authenticate
exports.walletAuthVerify = async (req, res) => {
    try {
        const { walletAddress, walletType, signature } = req.body;

        if (!walletAddress || !signature) {
            return res.status(400).json({
                success: false,
                error: 'WALLET_ADDRESS_AND_SIGNATURE_REQUIRED'
            });
        }

        // Validate EVM address format (0x... followed by 40 hex chars)
        const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!evmAddressRegex.test(walletAddress)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_EVM_ADDRESS_FORMAT'
            });
        }

        // Verify challenge was generated
        if (!req.session.walletChallenge) {
            return res.status(400).json({
                success: false,
                error: 'NO_AUTH_CHALLENGE_FOUND'
            });
        }

        const { challenge, message: storedMessage } = req.session.walletChallenge;

        // Use ethers.js to verify the signature against the stored message
        const { ethers } = require('ethers');
        
        // Recover the address from the signature
        let recoveredAddress;
        try {
            // Verify using the exact message that was signed
            recoveredAddress = ethers.verifyMessage(storedMessage, signature);
        } catch (verifyError) {
            console.error('Signature verification error:', verifyError);
            return res.status(400).json({
                success: false,
                error: 'SIGNATURE_VERIFICATION_FAILED'
            });
        }

        // Verify the signature matches the claimed address
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(400).json({
                success: false,
                error: 'SIGNATURE_VERIFICATION_FAILED'
            });
        }

        // Find or create user by wallet address
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (!user) {
            // Create new user with wallet auth - walletAddress is primary identifier
            user = new User({
                walletAddress: walletAddress.toLowerCase(),
                walletType: walletType || 'metamask'
            });
            await user.save();
        }

        // Clear challenge from session
        delete req.session.walletChallenge;

        // Log user in using passport
        req.login(user, (err) => {
            if (err) {
                console.error('Wallet login error:', err);
                return res.status(500).json({
                    success: false,
                    error: 'WALLET_AUTH_SESSION_FAILED'
                });
            }

            res.json({
                success: true,
                message: 'WALLET_AUTH_SUCCESSFUL',
                redirect: '/command-center',
                user: {
                    id: user.id,
                    walletAddress: user.walletAddress,
                    profile: user.profile,
                    isWalletAuth: user.isWalletAuth
                }
            });
        });
    } catch (error) {
        console.error('Wallet auth verify error:', error);
        res.status(500).json({ success: false, error: 'WALLET_AUTH_VERIFICATION_FAILED' });
    }
};

// Get supported wallets info
exports.getSupportedWallets = (req, res) => {
    res.json({
        success: true,
        wallets: [
            {
                id: 'metamask',
                name: 'MetaMask',
                icon: '/assets/wallets/metamask.png',
                supported: true
            },
            {
                id: 'trustwallet',
                name: 'Trust Wallet',
                icon: '/assets/wallets/trustwallet.png',
                supported: true
            },
            {
                id: 'coinbase',
                name: 'Coinbase Wallet',
                icon: '/assets/wallets/coinbase.png',
                supported: true
            }
        ],
        message: 'Supported EVM-compatible wallets'
    });
};

exports.postRegister = async (req, res) => {
    const { username, password, confirmPassword } = req.body;
    let errors = [];

    if (!username || !password || !confirmPassword) {
        errors.push({ msg: 'REQUIRED_FIELDS_MISSING' });
    }

    if (password !== confirmPassword) {
        errors.push({ msg: 'PASSWORD_MISMATCH' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'PASSWORD_SECURITY_FAIL_MIN_6_CHAR' });
    }

    if (errors.length > 0) {
        res.render('register', { errors, username, password, confirmPassword, title: 'PULSE | Register' });
    } else {
        User.findOne({ username: username.toLowerCase() }).then(user => {
            if (user) {
                errors.push({ msg: 'NODE_IDENTIFIER_EXISTS' });
                res.render('register', { errors, username, password, confirmPassword, title: 'PULSE | Register' });
            } else {
                const newUser = new User({ username: username.toLowerCase(), password });

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser.save()
                            .then(user => {
                                req.login(user, (err) => {
                                    if (err) throw err;
                                    req.flash('success_msg', 'NODE_SYNC_ESTABLISHED');
                                    res.redirect('/command-center');
                                });
                            })
                            .catch(err => console.log(err));
                    });
                });
            }
        });
    }
};

exports.postLogin = (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/command-center',
        failureRedirect: '/auth/login',
        failureFlash: true
    })(req, res, next);
};

exports.getLogout = (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'SESSION_TERMINATED');
        res.redirect('/auth/login');
    });
};
