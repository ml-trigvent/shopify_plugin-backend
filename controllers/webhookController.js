const Order = require('../models/Order');
const Log = require('../models/Log');
const { sendToEasyClient } = require('../services/easyClient.service');
const webhookService = require('../services/webhook.service');

// POST /webhook/orders/create
async function orderCreated(req, res) {
  res.status(200).send('OK');
  const order = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  (async () => {
    try {
      const data = webhookService.extractOrderPayload(order, shop);

      await Order.create(data);
      await Log.create(shop, 'order_created', order, 'received');

      await sendToEasyClient(shop, {
        ...data.easyClientPayload,
        event: 'order_placed',
      });
    } catch (err) {
      console.error('orderCreated error:', err.message);
    }
  })();
}

// POST /webhook/orders/paid
async function orderPaid(req, res) {
  res.status(200).send('OK');
  const order = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  (async () => {
    try {
      await Order.updateStatus(shop, order.name, 'paid');
      await Log.create(shop, 'order_paid', order, 'received');

      const data = webhookService.extractOrderPayload(order, shop);
      await sendToEasyClient(shop, {
        ...data.easyClientPayload,
        event: 'payment_success',
      });
    } catch (err) {
      console.error('orderPaid error:', err.message);
    }
  })();
}

// POST /webhook/orders/updated
async function orderUpdated(req, res) {
  res.status(200).send('OK');
  const order = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  (async () => {
    try {
      await Log.create(shop, 'order_updated', order, 'received');
    } catch (err) {
      console.error('orderUpdated error:', err.message);
    }
  })();
}

// POST /webhook/orders/cancelled
async function orderCancelled(req, res) {
  res.status(200).send('OK');
  const order = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  (async () => {
    try {
      await Order.updateStatus(shop, order.name, 'cancelled');
      await Log.create(shop, 'order_cancelled', order, 'received');

      const data = webhookService.extractOrderPayload(order, shop);
      await sendToEasyClient(shop, {
        ...data.easyClientPayload,
        event: 'order_cancelled',
      });
    } catch (err) {
      console.error('orderCancelled error:', err.message);
    }
  })();
}

// POST /webhook/fulfillments/create
async function fulfillmentCreated(req, res) {
  res.status(200).send('OK');
  const fulfillment = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  (async () => {
    try {
      const data = webhookService.extractFulfillmentPayload(fulfillment, shop);
      await Order.updateTracking(shop, data.shopifyOrderId, data.trackingNumber);
      await Log.create(shop, 'order_shipped', fulfillment, 'received');

      await sendToEasyClient(shop, {
        ...data.easyClientPayload,
        event: 'order_shipped',
      });
    } catch (err) {
      console.error('fulfillmentCreated error:', err.message);
    }
  })();
}

// POST /webhook/checkouts/create
async function checkoutCreated(req, res) {
  res.status(200).send('OK');
  const checkout = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  (async () => {
    try {
      const data = webhookService.extractCheckoutPayload(checkout, shop);
      await Log.create(shop, 'checkout_created', checkout, 'received');

      await sendToEasyClient(shop, {
        ...data.easyClientPayload,
        event: 'checkout_started',
      });
    } catch (err) {
      console.error('checkoutCreated error:', err.message);
    }
  })();
}

// POST /webhook/checkouts/update
async function checkoutUpdated(req, res) {
  res.status(200).send('OK');
  const checkout = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  (async () => {
    try {
      const data = webhookService.extractCheckoutPayload(checkout, shop);
      await Log.create(shop, 'checkout_updated', checkout, 'received');

      await sendToEasyClient(shop, {
        ...data.easyClientPayload,
        event: 'checkout_updated',
      });
    } catch (err) {
      console.error('checkoutUpdated error:', err.message);
    }
  })();
}

// POST /webhook/carts/create
async function cartCreated(req, res) {
  res.status(200).send('OK');
  const cart = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  (async () => {
    try {
      const data = webhookService.extractCartPayload(cart, shop);
      await Log.create(shop, 'cart_created', cart, 'received');

      await sendToEasyClient(shop, {
        ...data.easyClientPayload,
        event: 'cart_created',
      });
    } catch (err) {
      console.error('cartCreated error:', err.message);
    }
  })();
}

// POST /webhook/carts/update
async function cartUpdated(req, res) {
  res.status(200).send('OK');
  const cart = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  (async () => {
    try {
      const data = webhookService.extractCartPayload(cart, shop);
      await Log.create(shop, 'cart_updated', cart, 'received');

      await sendToEasyClient(shop, {
        ...data.easyClientPayload,
        event: 'cart_updated',
      });
    } catch (err) {
      console.error('cartUpdated error:', err.message);
    }
  })();
}

module.exports = {
  orderCreated,
  orderPaid,
  orderUpdated,
  orderCancelled,
  fulfillmentCreated,
  checkoutCreated,
  checkoutUpdated,
  cartCreated,
  cartUpdated,
};
