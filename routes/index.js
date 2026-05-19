const express = require('express');
const router = express.Router();
const { 
    getLanding, 
    getDashboard, 
    getIntelligence,
    getCommandCenter,
    followDao,
    unfollowDao,
    getProfile,
    updateProfile
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

// Scanner - Query any DAO by UUID
router.get('/scanner', ensureAuth, (req, res) => {
    res.render('scanner', { title: 'PULSE | DAO Scanner', daoData: null, error: null });
});

router.post('/scanner', ensureAuth, async (req, res) => {
    const apiService = require('../services/apiService');
    const { syncDaoData } = require('../services/healthService');
    
    try {
        const daoId = req.body.daoId ? req.body.daoId.trim() : '';
        
        if (!daoId) {
            return res.render('scanner', { title: 'PULSE | DAO Scanner', daoData: null, error: 'Please enter a DAO UUID' });
        }
        
        // Clean the DAO ID
        const cleanDaoId = daoId.replace(/[^a-zA-Z0-9_-]/g, '');
        
        console.log('[SCANNER] Scanning DAO:', cleanDaoId);
        
        // Fetch all data in parallel
        const [bounties, contributors, healthData] = await Promise.all([
            apiService.getBounties(cleanDaoId),
            apiService.getContributors(cleanDaoId),
            (async () => {
                try {
                    // Try to get or create a snapshot
                    const Snapshot = require('../models/Snapshot');
                    let snapshot = await Snapshot.findOne({ daoId: cleanDaoId }).sort({ timestamp: -1 });
                    if (!snapshot) {
                        snapshot = await syncDaoData(cleanDaoId);
                    }
                    return snapshot;
                } catch (e) {
                    return null;
                }
            })()
        ]);
        
        // Try to get organization name
        let orgName = 'Unknown DAO';
        try {
            const orgs = await apiService.getOrganizations();
            const org = orgs.find(o => o.id === cleanDaoId);
            if (org) orgName = org.name;
        } catch (e) {}
        
        const daoData = {
            id: cleanDaoId,
            name: orgName,
            bounties: bounties || [],
            contributors: contributors || [],
            health: healthData ? {
                score: healthData.healthScore,
                metrics: healthData.metrics,
                lastSync: healthData.timestamp
            } : null
        };
        
        console.log('[SCANNER] Data fetched:', {
            bounties: daoData.bounties.length,
            contributors: daoData.contributors.length,
            hasHealth: !!daoData.health
        });
        
        res.render('scanner', { title: 'PULSE | DAO Scanner', daoData, error: null });
        
    } catch (err) {
        console.error('[SCANNER ERROR]', err.message);
        res.render('scanner', { title: 'PULSE | DAO Scanner', daoData: null, error: 'Failed to fetch DAO data: ' + err.message });
    }
});

// Protected Routes
router.get('/command-center', ensureAuth, getCommandCenter);
router.get('/profile', ensureAuth, getProfile);
router.post('/profile', ensureAuth, updateProfile);
router.post('/follow-dao', ensureAuth, followDao);
router.post('/unfollow-dao', ensureAuth, unfollowDao);

module.exports = router;
