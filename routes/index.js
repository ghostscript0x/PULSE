const express = require('express');
const router = express.Router();
const { 
    getLanding, 
    getDashboard, 
    getIntelligence,
    getContributors, 
    getBounties,
    getBountyDetail,
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
router.get('/features', (req, res) => res.render('features', { title: 'PULSE | Core Capabilities' }));
router.get('/privacy', (req, res) => res.render('privacy', { title: 'PULSE | Privacy Policy' }));
router.get('/terms', (req, res) => res.render('terms', { title: 'PULSE | Terms of Service' }));
router.get('/dashboard', ensureAuth, getDashboard);
router.get('/dashboard/:daoId', ensureAuth, (req, res) => res.redirect('/intelligence/' + req.params.daoId));
router.get('/intelligence/:daoId?', ensureAuth, getIntelligence);
router.get('/contributors/:daoId?', ensureAuth, getContributors);
router.get('/bounties/:daoId?', ensureAuth, getBounties);
router.get('/bounty/:bountyId', ensureAuth, getBountyDetail);
router.get('/insights', ensureAuth, async (req, res) => {
    const User = require('../models/User');
    const Snapshot = require('../models/Snapshot');
    const { syncDaoData } = require('../services/healthService');
    try {
        const user = await User.findById(req.user.id);
        const followedDaos = user.followedDaos || [];
        
        // Get selected DAO from query param, default to first
        let selectedDao = req.query.dao || (followedDaos.length > 0 ? followedDaos[0].daoId : null);
        
        // JIT SYNC: Ensure snapshot exists for selected DAO before rendering
        if (selectedDao) {
            const existingSnapshot = await Snapshot.findOne({ daoId: selectedDao }).sort({ timestamp: -1 });
            if (!existingSnapshot) {
                console.log(`[INSIGHTS_JIT] No snapshot for ${selectedDao}, triggering sync...`);
                try {
                    await syncDaoData(selectedDao);
                } catch (syncErr) {
                    console.warn(`[INSIGHTS_JIT] Sync failed for ${selectedDao}:`, syncErr.message);
                }
            }
        }
        
        // Fetch local snapshot stats
        const snapshotCount = await Snapshot.countDocuments();
        const uniqueDaos = await Snapshot.distinct('daoId');
        const avgHealth = snapshotCount > 0 
            ? Math.round((await Snapshot.aggregate([
                { $group: { _id: null, avg: { $avg: "$healthScore" } } }
            ]))[0]?.avg || 0)
            : null;
        
        res.render('insights', { 
            title: 'PULSE | Data Intelligence',
            followedDaos,
            selectedDao,
            snapshotCount,
            uniqueDaos: uniqueDaos.length,
            avgHealth
        });
    } catch (err) {
        console.error('[INSIGHTS_ERROR]', err);
        res.render('insights', { 
            title: 'PULSE | Data Intelligence',
            followedDaos: [],
            selectedDao: null,
            snapshotCount: 0,
            uniqueDaos: 0,
            avgHealth: null
        });
    }
});
router.get('/docs', ensureAuth, (req, res) => res.render('docs', { title: 'PULSE | Documentation' }));

// Protected Routes
router.get('/command-center', ensureAuth, getCommandCenter);
router.post('/follow-dao', ensureAuth, followDao);
router.post('/unfollow-dao', ensureAuth, unfollowDao);

module.exports = router;
