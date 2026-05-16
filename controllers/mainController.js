const Snapshot = require('../models/Snapshot');

exports.getLanding = async (req, res) => {
    try {
        console.log('[RENDERING VIEW] Landing');
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
        console.log(`[FETCHING DATA] Contributors | DAO: ${daoId || 'Global'}`);
        
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
        console.log(`[FETCHING DATA] Bounties | DAO: ${daoId || 'Global'}`);
        
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
