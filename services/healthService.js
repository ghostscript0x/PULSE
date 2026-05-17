const apiService = require('./apiService');
const Snapshot = require('../models/Snapshot');

/**
 * Real-Time Health Engine
 * Returns score or INSUFFICIENT_DATA
 */
const computeHealth = (data) => {
    /* ... existing computeHealth logic ... */
    const {
        velocity,
        completionRate,
        retention,
        reputationGrowth,
        diversity
    } = data;

    const score = 
        (velocity * 0.30) + 
        (completionRate * 0.25) + 
        (retention * 0.20) + 
        (reputationGrowth * 0.15) + 
        (diversity * 0.10);

    return Math.min(100, Math.max(0, Math.round(score)));
};

/**
 * Just-In-Time Telemetry Synchronization
 */
const syncDaoData = async (daoId) => {
    try {
        console.log(`[JIT_SYNC] Initializing Node: ${daoId}`);
        
        let [bounties, contributors] = await Promise.all([
            apiService.getBounties(daoId),
            apiService.getContributors(daoId)
        ]);

        bounties = Array.isArray(bounties) ? bounties : [];
        contributors = Array.isArray(contributors) ? contributors : [];

        const totalBounties = bounties.length;
        const completedBounties = bounties.filter(b => b.bountyCompleted === true || b.status === 'Winner').length;
        const totalSubmissions = bounties.reduce((acc, b) => acc + (b.submissionsCount || 0), 0);
        
        // Calculate dynamic retention based on active vs total contributors
        const activeCount = contributors.filter(c => {
            const lastActive = c.lastActive ? new Date(c.lastActive) : null;
            const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return lastActive && lastActive > monthAgo;
        }).length;
        const retentionVal = contributors.length > 0 ? (activeCount / contributors.length) * 100 : 0;

        const metrics = {
            velocity: Math.min(100, (totalBounties / 50) * 100), // Normalized to 50 for higher sensitivity
            completionRate: totalBounties > 0 ? (completedBounties / totalBounties) * 100 : 0,
            retention: Math.max(20, Math.min(100, retentionVal + 30)), // Add base floor but keep dynamic
            reputationGrowth: contributors.length > 0 ? (contributors.reduce((acc, c) => acc + (c.reputationScore || 0), 0) / contributors.length) / 10 : 0,
            diversity: totalSubmissions > 0 ? Math.min(100, (totalSubmissions / (totalBounties || 1)) * 20) : 0
        };
        
        const healthScore = computeHealth(metrics);
        
        return await Snapshot.create({
            daoId,
            healthScore,
            metrics,
            rawLiveData: { bounties, contributors }
        });
    } catch (err) {
        console.error(`[SYNC_ERROR] Node: ${daoId}`, err.message);
        return null;
    }
};

module.exports = { computeHealth, syncDaoData };
