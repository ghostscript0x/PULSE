const apiService = require('../services/apiService');
const { computeHealth } = require('../services/healthService');
const Snapshot = require('../models/Snapshot');

exports.getDiscovery = async (req, res, next) => {
    try {
        console.log('[DISCOVERY] Fetching all organizations');
        const orgs = await apiService.getOrganizations();
        res.json({ status: 'success', data: orgs });
    } catch (err) {
        next(err);
    }
};

/**
 * Health Intelligence Controller
 * Derives metrics from raw DAO data lists
 */
exports.getHealth = async (req, res, next) => {
    try {
        const daoId = req.params.daoId ? req.params.daoId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        if (!daoId) {
            return res.status(400).json({ status: 'error', message: 'INVALID_DAO_ID' });
        }
        
        // 1. Fetch live raw data
        let [bounties, contributors] = await Promise.all([
            apiService.getBounties(daoId),
            apiService.getContributors(daoId)
        ]);

        // Ensure we are working with arrays
        bounties = Array.isArray(bounties) ? bounties : [];
        contributors = Array.isArray(contributors) ? contributors : [];

        console.log(`[PROCESSING DATA] Bounties: ${bounties.length} | Contributors: ${contributors.length}`);

        // 2. Compute Metrics from Raw Production Data
        const totalBounties = bounties.length;
        const completedBounties = bounties.filter(b => b.bountyCompleted === true || b.status === 'Winner').length;
        const totalSubmissions = bounties.reduce((acc, b) => acc + (b.submissionsCount || 0), 0);
        
        const metrics = {
            velocity: Math.min(100, (totalBounties / 20) * 100), // Normalized to 20 per cycle
            completionRate: totalBounties > 0 ? (completedBounties / totalBounties) * 100 : 0,
            retention: contributors.length > 0 ? 65 : 0, // Base line for active contributors
            reputationGrowth: contributors.reduce((acc, c) => acc + (c.reputationScore || 0), 0) / (contributors.length || 1),
            diversity: totalSubmissions > 0 ? Math.min(100, (totalSubmissions / totalBounties) * 10) : 0
        };
        
        // 3. Compute final score
        const healthScore = computeHealth(metrics);
        
        // 4. Store snapshot
        console.log('[SAVING SNAPSHOT]');
        const snapshot = await Snapshot.create({
            daoId,
            healthScore,
            metrics,
            rawLiveData: { bounties, contributors }
        });

        res.json({
            status: 'success',
            data: {
                daoId,
                healthScore,
                timestamp: snapshot.timestamp,
                metrics
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.getContributors = async (req, res, next) => {
    try {
        const daoId = req.params.daoId ? req.params.daoId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        const contributors = await apiService.getContributors(daoId);
        res.json({ status: 'success', data: contributors });
    } catch (err) {
        next(err);
    }
};

exports.getBounties = async (req, res, next) => {
    try {
        const daoId = req.params.daoId ? req.params.daoId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        const bounties = await apiService.getBounties(daoId);
        res.json({ status: 'success', data: bounties });
    } catch (err) {
        next(err);
    }
};

exports.getSnapshots = async (req, res, next) => {
    try {
        const daoId = req.params.daoId ? req.params.daoId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        const snapshots = await Snapshot.find({ daoId }).sort({ timestamp: -1 }).limit(50);
        res.json({ status: 'success', data: snapshots });
    } catch (err) {
        next(err);
    }
};

const aiService = require('../services/aiService');

exports.getInsights = async (req, res, next) => {
    try {
        const daoId = req.params.daoId ? req.params.daoId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        if (!daoId) {
            return res.status(400).json({ status: 'error', message: 'INVALID_DAO_ID' });
        }
        
        const latest = await Snapshot.findOne({ daoId }).sort({ timestamp: -1 });
        if (!latest || latest.healthScore === "INSUFFICIENT_DATA") {
            return res.status(400).json({ status: 'error', message: 'INSUFFICIENT_DATA', code: 'INSUFFICIENT_DATA' });
        }

        try {
            const insights = await aiService.generateInsights(latest.metrics);
            res.json({ status: 'success', data: insights });
        } catch (err) {
            if (err.message === 'GROQ_API_KEY_MISSING') {
                return res.json({ status: 'success', message: 'AI_DISABLED', code: 'AI_DISABLED' });
            }
            throw err;
        }
    } catch (err) {
        next(err);
    }
};
