const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// API Routes
router.get('/discovery', apiController.getDiscovery);
router.get('/health/:daoId', apiController.getHealth);
router.get('/contributors/:daoId', apiController.getContributors);
router.get('/bounties/:daoId', apiController.getBounties);
router.get('/snapshots/:daoId', apiController.getSnapshots);
router.get('/insights/:daoId', apiController.getInsights);

module.exports = router;
