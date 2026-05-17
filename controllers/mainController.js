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

exports.getDashboard = async (req, res) => {
    try {
        let daoId = req.params.daoId ? req.params.daoId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        const user = await User.findById(req.user.id);
        const followedDaos = user.followedDaos || [];
        
        // 1. AUTO-FOLLOW LOGIC: If a specific daoId is requested but NOT followed, add it automatically
        if (daoId && !followedDaos.some(d => d.daoId === daoId)) {
            console.log(`[AUTO_FOLLOW] User: ${user.username} -> Node: ${daoId}`);
            
            // Try to find the name from registry
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
        if (!daoId) {
            if (user.followedDaos.length === 0) {
                return res.render('dashboard', { 
                    title: 'PULSE | Intelligence Dashboard',
                    latest: null,
                    history: [],
                    followedDaos: [],
                    error: 'NO_ACTIVE_TELEMETRY_LINKS'
                });
            }
            daoId = user.followedDaos[0].daoId;
            return res.redirect('/dashboard/' + daoId);
        }

        // 3. JIT SYNC: If no snapshots exist for this node, sync immediately
        let snapshots = await Snapshot.find({ daoId }).sort({ timestamp: -1 }).limit(30);
        
        if (snapshots.length === 0) {
            console.log(`[JIT_INITIALIZE] No snapshots for ${daoId}. Syncing...`);
            const newSnapshot = await syncDaoData(daoId);
            if (newSnapshot) {
                snapshots = [newSnapshot];
            }
        }

        if (snapshots.length === 0) {
            return res.render('dashboard', { 
                title: 'PULSE | Intelligence Dashboard',
                latest: null,
                history: [],
                followedDaos: user.followedDaos,
                error: 'NODE_SYNC_PENDING'
            });
        }

        const latest = snapshots[0];
        const history = snapshots.reverse();

        res.render('dashboard', { 
            title: 'PULSE | Intelligence Dashboard',
            latest,
            history,
            followedDaos: user.followedDaos,
            error: null
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

        // Auto-follow logic for community page too
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

        // JIT Sync check
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
                // Trigger JIT Sync if no data
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

// COMMAND CENTER LOGIC
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
        
        // Check if already following
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
