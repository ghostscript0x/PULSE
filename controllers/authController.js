const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

exports.getLogin = (req, res) => res.render('login', { title: 'PULSE | Login' });
exports.getRegister = (req, res) => res.render('register', { title: 'PULSE | Register' });

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
