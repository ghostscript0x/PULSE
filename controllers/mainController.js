const Snapshot = require('../models/Snapshot');
const User = require('../models/User');

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
        const daoId = req.params.daoId ? req.params.daoId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        console.log(`[FETCHING DATA] Dashboard | DAO: ${daoId || 'Latest'}`);
        
        const query = daoId ? { daoId } : {};
        const snapshots = await Snapshot.find(query).sort({ timestamp: -1 }).limit(30);
        
        if (snapshots.length === 0) {
            return res.render('dashboard', { 
                title: 'PULSE | Intelligence Dashboard',
                latest: null,
                history: [],
                error: 'NO_DATA_AVAILABLE'
            });
        }

        const latest = snapshots[0];
        const history = snapshots.reverse();

        res.render('dashboard', { 
            title: 'PULSE | Intelligence Dashboard',
            latest,
            history,
            error: null
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Intelligence System Offline' });
    }
};

exports.getContributors = async (req, res) => {
    try {
        const daoId = req.params.daoId ? req.params.daoId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        let contributors = [];
        const query = daoId ? { daoId } : {};
        const latest = await Snapshot.findOne(query).sort({ timestamp: -1 });
        
        if (latest && latest.rawLiveData && latest.rawLiveData.contributors) {
            contributors = latest.rawLiveData.contributors;
        }

        res.render('contributors', { 
            title: 'PULSE | Contributor Analytics',
            contributors 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getBounties = async (req, res) => {
    try {
        const daoId = req.params.daoId ? req.params.daoId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        let bounties = [];
        const query = daoId ? { daoId } : {};
        const latest = await Snapshot.findOne(query).sort({ timestamp: -1 });
        
        if (latest && latest.rawLiveData && latest.rawLiveData.bounties) {
            bounties = latest.rawLiveData.bounties;
        }

        res.render('bounties', { 
            title: 'PULSE | Bounty Lifecycle',
            bounties 
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
