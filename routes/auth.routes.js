const express = require('express');
const router = express.Router();
const { install, callback } = require('../controllers/authController');

router.get('/shopify', install);
router.get('/callback', callback);

module.exports = router;
