const express = require('express');
const router = express.Router();
const { saveSettings, getSettings, getLogs, retryLog } = require('../controllers/settingsController');

router.post('/settings', saveSettings);
router.get('/settings', getSettings);
router.get('/logs', getLogs);
router.post('/logs/:id/retry', retryLog);

module.exports = router;
