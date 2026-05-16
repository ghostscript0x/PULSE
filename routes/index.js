const express = require('express');
const router = express.Router();
const { 
    getLanding, 
    getDashboard, 
    getContributors, 
    getBounties 
} = require('../controllers/mainController');

router.get('/', getLanding);
router.get('/about', (req, res) => res.render('about', { title: 'PULSE | System Protocol' }));
router.get('/dashboard/:daoId?', getDashboard);
router.get('/contributors/:daoId?', getContributors);
router.get('/bounties/:daoId?', getBounties);

module.exports = router;
