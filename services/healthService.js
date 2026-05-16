/**
 * Real-Time Health Engine
 * Returns score or INSUFFICIENT_DATA
 */
const computeHealth = (data) => {
    console.log('[COMPUTING HEALTH SCORE]');
    
    const {
        velocity,
        completionRate,
        retention,
        reputationGrowth,
        diversity
    } = data;

    // Strict validation for real data
    const metrics = [velocity, completionRate, retention, reputationGrowth, diversity];
    if (metrics.some(m => m === undefined || m === null)) {
        console.warn('[INSUFFICIENT DATA] Missing core metrics');
        return "INSUFFICIENT_DATA";
    }

    const score = 
        (velocity * 0.30) + 
        (completionRate * 0.25) + 
        (retention * 0.20) + 
        (reputationGrowth * 0.15) + 
        (diversity * 0.10);

    return Math.min(100, Math.max(0, Math.round(score)));
};

module.exports = { computeHealth };
