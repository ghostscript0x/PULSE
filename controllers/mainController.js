const Snapshot = require('../models/Snapshot');
const User = require('../models/User');
const { syncDaoData } = require('../services/healthService');
const apiService = require('../services/apiService');

exports.getLanding = async (req, res) => {
    try {
        res.render('index', { title: 'PULSE | Community Health Layer' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

/**
 * GLOBAL DASHBOARD (Bird's Eye View)
 */
exports.getDashboard = async (req, res) => {
    try {
        const stats = await apiService.getNetworkVitals();
        const user = await User.findById(req.user.id);
        
        // Fetch recent activity (snapshots) for the activity feed
        const recentActivity = await Snapshot.find().sort({ timestamp: -1 }).limit(10);
        
        if (!stats) {
            throw new Error('NO_LIVE_STATS_RETURNED_FROM_API');
        }
        
        res.render('dashboard', { 
            title: 'PULSE | Ecosystem Dashboard',
            stats,
            followedDaos: user.followedDaos || [],
            recentActivity: recentActivity || []
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Dashboard Synchronization Offline' });
    }
};

/**
 * CORE INTELLIGENCE (Specific DAO View)
 */
exports.getIntelligence = async (req, res) => {
    try {
        let daoId = req.params.daoId ? req.params.daoId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        const user = await User.findById(req.user.id);
        const followedDaos = user.followedDaos || [];
        
        // 1. AUTO-FOLLOW LOGIC
        if (daoId && !followedDaos.some(d => d.daoId === daoId)) {
            console.log(`[AUTO_FOLLOW] User: ${user.username} -> Node: ${daoId}`);
            let nodeName = 'SYNCED_NODE_' + daoId.substring(0,4).toUpperCase();
            try {
                const orgs = await apiService.getOrganizations();
                const targetOrg = orgs.find(o => o.id === daoId);
                if (targetOrg) nodeName = targetOrg.name;
            } catch (apiErr) {
                console.warn('[REGISTRY_FETCH_FAIL] Falling back to default name');
            }
            user.followedDaos.push({ daoId, name: nodeName });
            await user.save();
        }

        // 2. Default to first node if none specified
        if (!daoId && user.followedDaos.length > 0) {
            daoId = user.followedDaos[0].daoId;
            return res.redirect('/intelligence/' + daoId);
        }

        // 3. JIT SYNC
        let snapshots = [];
        if (daoId) {
            snapshots = await Snapshot.find({ daoId }).sort({ timestamp: -1 }).limit(30);
            if (snapshots.length === 0) {
                console.log(`[JIT_INITIALIZE] No snapshots for ${daoId}. Syncing...`);
                const newSnapshot = await syncDaoData(daoId);
                if (newSnapshot) snapshots = [newSnapshot];
            }
        }

        const latest = snapshots.length > 0 ? snapshots[0] : null;
        const history = snapshots.length > 0 ? [...snapshots].reverse() : [];

        res.render('intelligence', { 
            title: 'PULSE | Intelligence Report',
            latest,
            history,
            followedDaos: user.followedDaos,
            error: daoId && !latest ? 'NODE_SYNC_PENDING' : null,
            activeDao: daoId
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Intelligence System Offline' });
    }
};

exports.getContributors = async (req, res) => {
    try {
        let daoId = req.params.daoId ? req.params.daoId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        const user = await User.findById(req.user.id);
        const followedDaos = user.followedDaos || [];

        if (followedDaos.length === 0 && !daoId) {
            return res.render('contributors', { 
                title: 'PULSE | Contributor Analytics',
                contributors: [],
                followedDaos: [],
                activeDao: null
            });
        }

        if (daoId && !followedDaos.some(d => d.daoId === daoId)) {
            let nodeName = 'NEW_NODE';
            try {
                const orgs = await apiService.getOrganizations();
                const targetOrg = orgs.find(o => o.id === daoId);
                if (targetOrg) nodeName = targetOrg.name;
            } catch (e) {}
            user.followedDaos.push({ daoId, name: nodeName });
            await user.save();
        }

        if (!daoId) daoId = user.followedDaos[0].daoId;

        let latest = await Snapshot.findOne({ daoId }).sort({ timestamp: -1 });
        if (!latest) {
            latest = await syncDaoData(daoId);
        }

        const contributors = (latest && latest.rawLiveData && latest.rawLiveData.contributors) ? latest.rawLiveData.contributors : [];

        res.render('contributors', { 
            title: 'PULSE | Contributor Analytics',
            contributors,
            followedDaos: user.followedDaos,
            activeDao: daoId
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getBounties = async (req, res) => {
    try {
        const daoId = req.params.daoId ? req.params.daoId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        const user = await User.findById(req.user.id);
        const followedDaos = user.followedDaos || [];

        if (!daoId && followedDaos.length > 0) {
            return res.redirect('/bounties/' + followedDaos[0].daoId);
        }

        let bounties = [];
        if (daoId) {
            const latest = await Snapshot.findOne({ daoId }).sort({ timestamp: -1 });
            if (latest && latest.rawLiveData && latest.rawLiveData.bounties) {
                bounties = latest.rawLiveData.bounties;
            } else {
                const synced = await syncDaoData(daoId);
                if (synced && synced.rawLiveData) bounties = synced.rawLiveData.bounties;
            }
        }

        res.render('bounties', { 
            title: 'PULSE | Bounty Lifecycle',
            bounties,
            followedDaos,
            activeDao: daoId
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getBountyDetail = async (req, res) => {
    try {
        const bountyId = req.params.bountyId.replace(/[^a-zA-Z0-9_-]/g, '');
        const user = await User.findById(req.user.id);
        const followedDaos = user.followedDaos || [];

        let bounty = null;
        let daoId = null;

        // Search through all followed DAOs for this bounty
        for (const dao of followedDaos) {
            const latest = await Snapshot.findOne({ daoId: dao.daoId }).sort({ timestamp: -1 });
            if (latest && latest.rawLiveData && latest.rawLiveData.bounties) {
                const found = latest.rawLiveData.bounties.find(b => b.id === bountyId || b.id === `bounty_${bountyId}`);
                if (found) {
                    bounty = found;
                    daoId = dao.daoId;
                    break;
                }
            }
        }

        if (!bounty) {
            // Try fetching from API directly
            const allBounties = [];
            for (const dao of followedDaos) {
                try {
                    const apiBounties = await apiService.getBounties(dao.daoId);
                    if (apiBounties && apiBounties.length > 0) {
                        allBounties.push(...apiBounties);
                    }
                } catch (e) {}
            }
            bounty = allBounties.find(b => b.id === bountyId || b.id === `bounty_${bountyId}`);
        }

        res.render('bounty-detail', { 
            title: 'PULSE | Bounty Details',
            bounty,
            bountyId,
            followedDaos,
            activeDao: daoId
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getCommandCenter = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.render('command-center', { 
            title: 'PULSE | Command Center',
            followedDaos: user.followedDaos 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.followDao = async (req, res) => {
    const { daoId, name } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (user.followedDaos.some(d => d.daoId === daoId)) {
            req.flash('error_msg', 'NODE_ALREADY_IN_REGISTRY');
            return res.redirect('/command-center');
        }
        user.followedDaos.push({ daoId, name });
        await user.save();
        req.flash('success_msg', 'NODE_SYNC_ESTABLISHED');
        res.redirect('/command-center');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.unfollowDao = async (req, res) => {
    const { daoId } = req.body;
    try {
        const user = await User.findById(req.user.id);
        user.followedDaos = user.followedDaos.filter(d => d.daoId !== daoId);
        await user.save();
        req.flash('success_msg', 'NODE_LINK_TERMINATED');
        res.redirect('/command-center');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.render('profile', { 
            title: 'PULSE | Profile',
            user,
            error: null,
            success: null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.updateProfile = async (req, res) => {
    const { username, profileName } = req.body;
    try {
        const user = await User.findById(req.user.id);
        
        // Check if username is already taken
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.render('profile', {
                    title: 'PULSE | Profile',
                    user,
                    error: 'Username already taken',
                    success: null
                });
            }
            user.username = username.trim();
        }
        
        // Update profile name
        if (profileName) {
            user.profile.name = profileName.trim();
        }
        
        await user.save();
        
        res.render('profile', {
            title: 'PULSE | Profile',
            user,
            error: null,
            success: 'Profile updated successfully'
        });
    } catch (err) {
        console.error(err);
        res.render('profile', {
            title: 'PULSE | Profile',
            user: req.user,
            error: 'Failed to update profile',
            success: null
        });
    }
};