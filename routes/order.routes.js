const express = require('express');
const router = express.Router();
const { getOrders, getStats } = require('../controllers/orderController');

router.get('/orders', getOrders);
router.get('/orders/stats', getStats);

module.exports = router;
