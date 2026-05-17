const express = require('express');
const router = express.Router();
const { 
    getLanding, 
    getDashboard, 
    getContributors, 
    getBounties,
    getCommandCenter,
    followDao,
    unfollowDao
} = require('../controllers/mainController');

// Auth Middleware
const ensureAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.flash('error_msg', 'ACCESS_DENIED_UNAUTHORIZED');
    res.redirect('/auth/login');
};

router.get('/', getLanding);
router.get('/about', (req, res) => res.render('about', { title: 'PULSE | System Protocol' }));
router.get('/dashboard/:daoId?', getDashboard);
router.get('/contributors/:daoId?', getContributors);
router.get('/bounties/:daoId?', getBounties);
router.get('/insights', (req, res) => res.render('insights', { title: 'PULSE | Data Intelligence' }));
router.get('/docs', (req, res) => res.render('docs', { title: 'PULSE | Documentation' }));

// Protected Routes
router.get('/command-center', ensureAuth, getCommandCenter);
router.post('/follow-dao', ensureAuth, followDao);
router.post('/unfollow-dao', ensureAuth, unfollowDao);

module.exports = router;
