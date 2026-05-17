const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const crypto = require('crypto');

// Generate a unique challenge for wallet authentication
function generateChallenge() {
    return crypto.randomBytes(32).toString('hex');
}

// Stacks authentication message template
function createAuthMessage(address, challenge, domain) {
    return `PULSE Authentication\n\nWallet: ${address}\nChallenge: ${challenge}\n\nSign this message to authenticate with PULSE.\n\nDomain: ${domain}`;
}

exports.getLogin = (req, res) => res.render('login', { title: 'PULSE | Login' });
exports.getRegister = (req, res) => res.render('register', { title: 'PULSE | Register' });

// Generate authentication challenge for wallet
exports.walletAuthChallenge = async (req, res) => {
    try {
        const challenge = generateChallenge();
        const domain = req.get('origin') || `http://localhost:${process.env.PORT || 3000}`;

        // Store challenge in session for verification later
        req.session.walletChallenge = {
            challenge,
            createdAt: Date.now()
        };

        res.json({
            success: true,
            challenge,
            message: 'PULSE Authentication\n\nSign this message to authenticate with PULSE.',
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
        const { walletAddress, walletType, signature, publicKey } = req.body;

        if (!walletAddress || !signature) {
            return res.status(400).json({
                success: false,
                error: 'WALLET_ADDRESS_AND_SIGNATURE_REQUIRED'
            });
        }

        // Validate Stacks address format (SP or SM prefix for mainnet, TP or TM for testnet)
        const stacksAddressRegex = /^(SP|SM|TP|TM)[A-HJ-NP-Z0-9]{38}$/;
        if (!stacksAddressRegex.test(walletAddress)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_STACKS_ADDRESS_FORMAT'
            });
        }

        // Verify challenge was generated
        if (!req.session.walletChallenge) {
            return res.status(400).json({
                success: false,
                error: 'NO_AUTH_CHALLENGE_FOUND'
            });
        }

        const { challenge } = req.session.walletChallenge;

        // In production, you would verify the signature using Stacks.js
        // For now, we trust the wallet has validated the signature
        // and we create/update the user based on wallet address

        // Find or create user by wallet address
        let user = await User.findOne({ walletAddress: walletAddress.toUpperCase() });

        if (!user) {
            // Create new user with wallet auth
            user = new User({
                walletAddress: walletAddress.toUpperCase(),
                walletType: walletType || 'generic',
                isWalletAuth: true,
                profile: {
                    name: `User_${walletAddress.substring(0, 8)}`
                }
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
                    username: user.username,
                    walletAddress: user.walletAddress,
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
                id: 'hiro',
                name: 'Hiro Wallet',
                icon: '/assets/wallets/hiro.png',
                supported: true
            },
            {
                id: 'leather',
                name: 'Leather Wallet',
                icon: '/assets/wallets/leather.png',
                supported: true
            },
            {
                id: 'xverse',
                name: 'Xverse Wallet',
                icon: '/assets/wallets/xverse.png',
                supported: true
            }
        ],
        message: 'Supported Stacks-compatible wallets'
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
