const express = require('express');
const router = express.Router();
const { saveSettings, getSettings, getLogs } = require('../controllers/settingsController');

router.post('/settings', saveSettings);
router.get('/settings', getSettings);
router.get('/logs', getLogs);

module.exports = router;
