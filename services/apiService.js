const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.ZERO_AUTH_API_BASE_URL || 'https://zeroauthoritydao.com/api';
const API_KEY = process.env.ZERO_AUTH_API_KEY;

const client = axios.create({
    baseURL: API_BASE,
    headers: { 
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json'
    },
    timeout: 20000 // 20s for large production lists
});

/**
 * Fetch live data with retries
 */
const fetchWithRetry = async (endpoint, retries = 2) => {
    try {
        console.log(`[FETCHING LIVE DATA] ${endpoint}`);
        const response = await client.get(endpoint);
        
        const data = response.data;
        let result = [];

        // Specific Unwrapping Logic for Zero Authority Production Wrapper
        if (endpoint.includes('/bounties/organizations')) {
            result = data.organizations || data.data || (Array.isArray(data) ? data : []);
        } else if (endpoint.includes('/bounties')) {
            result = data.bounties || data.data || (Array.isArray(data) ? data : []);
        } else if (endpoint.includes('/users')) {
            result = data.users || data.data || (Array.isArray(data) ? data : []);
        } else {
            result = data;
        }

        console.log(`[API RESPONSE RECEIVED] ${endpoint} | Items: ${Array.isArray(result) ? result.length : 'Object'}`);

        // STRICT FILTERING: If organizationId was requested, enforce it on the result set
        if (endpoint.includes('organizationId=') && Array.isArray(result)) {
            const requestedId = endpoint.split('organizationId=')[1].split('&')[0];
            console.log(`[ENFORCING_FILTER] Target: ${requestedId}`);
            result = result.filter(item => {
                const itemOrgId = item.organizationId || item.orgId || item.daoId;
                return itemOrgId === requestedId;
            });
            console.log(`[FILTER_COMPLETE] Items remaining: ${result.length}`);
        }

        return result;
    } catch (err) {
        if (retries > 0) {
            console.warn(`[API RETRY] ${endpoint} | Remaining: ${retries}`);
            return fetchWithRetry(endpoint, retries - 1);
        }
        console.error(`[API ERROR] ${endpoint} | Status: ${err.response ? err.response.status : 'TIMEOUT'}`);
        throw err;
    }
};

exports.getOrganizations = () => fetchWithRetry('/bounties/organizations');
exports.getContributors = (daoId) => fetchWithRetry(`/users?organizationId=${daoId}`);
exports.getBounties = (daoId) => fetchWithRetry(`/bounties?organizationId=${daoId}`);
exports.getNetworkVitals = () => fetchWithRetry('/stats');
exports.getUserProfile = (stxAddress) => fetchWithRetry(`/users/${stxAddress}`);
