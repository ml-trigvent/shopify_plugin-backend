const express = require('express');
const router = express.Router();
const verify = require('../middleware/verifyShopify');
const {
  orderCreated,
  orderPaid,
  orderUpdated,
  orderCancelled,
  fulfillmentCreated,
  checkoutCreated,
  checkoutUpdated,
  cartCreated,
  cartUpdated,
} = require('../controllers/webhookController');

router.post('/orders/create', verify, orderCreated);
router.post('/orders/paid', verify, orderPaid);
router.post('/orders/updated', verify, orderUpdated);
router.post('/orders/cancelled', verify, orderCancelled);
router.post('/fulfillments/create', verify, fulfillmentCreated);
router.post('/checkouts/create', verify, checkoutCreated);
router.post('/checkouts/update', verify, checkoutUpdated);
router.post('/carts/create', verify, cartCreated);
router.post('/carts/update', verify, cartUpdated);

module.exports = router;
