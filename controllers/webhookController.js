const Order = require('../models/Order');
const Log = require('../models/Log');
const { sendToEasyClient } = require('../services/easyClient.service');
const webhookService = require('../services/webhook.service');

// POST /webhook/orders/create
async function orderCreated(req, res) {
  const order = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  try {
    const data = webhookService.extractOrderPayload(order, shop);

    await Order.create(data);
    await Log.create(shop, 'order_created', order, 'received');

    await sendToEasyClient(shop, {
      ...data.easyClientPayload,
      event: 'order_placed',
    });

    res.status(200).send('OK');
  } catch (err) {
    console.error('orderCreated error:', err.message);
    res.status(500).send('Error');
  }
}

// POST /webhook/orders/paid
async function orderPaid(req, res) {
  const order = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  try {
    await Order.updateStatus(shop, order.name, 'paid');
    await Log.create(shop, 'order_paid', order, 'received');

    const data = webhookService.extractOrderPayload(order, shop);
    await sendToEasyClient(shop, {
      ...data.easyClientPayload,
      event: 'payment_success',
    });

    res.status(200).send('OK');
  } catch (err) {
    console.error('orderPaid error:', err.message);
    res.status(500).send('Error');
  }
}

// POST /webhook/orders/updated
async function orderUpdated(req, res) {
  const order = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  try {
    await Log.create(shop, 'order_updated', order, 'received');
    res.status(200).send('OK');
  } catch (err) {
    console.error('orderUpdated error:', err.message);
    res.status(500).send('Error');
  }
}

// POST /webhook/orders/cancelled
async function orderCancelled(req, res) {
  const order = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  try {
    await Order.updateStatus(shop, order.name, 'cancelled');
    await Log.create(shop, 'order_cancelled', order, 'received');

    const data = webhookService.extractOrderPayload(order, shop);
    await sendToEasyClient(shop, {
      ...data.easyClientPayload,
      event: 'order_cancelled',
    });

    res.status(200).send('OK');
  } catch (err) {
    console.error('orderCancelled error:', err.message);
    res.status(500).send('Error');
  }
}

// POST /webhook/fulfillments/create
async function fulfillmentCreated(req, res) {
  const fulfillment = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  try {
    const data = webhookService.extractFulfillmentPayload(fulfillment, shop);
    await Order.updateTracking(shop, data.shopifyOrderId, data.trackingNumber);
    await Log.create(shop, 'order_shipped', fulfillment, 'received');

    await sendToEasyClient(shop, {
      ...data.easyClientPayload,
      event: 'order_shipped',
    });

    res.status(200).send('OK');
  } catch (err) {
    console.error('fulfillmentCreated error:', err.message);
    res.status(500).send('Error');
  }
}

// POST /webhook/checkouts/create
async function checkoutCreated(req, res) {
  const checkout = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  try {
    const data = webhookService.extractCheckoutPayload(checkout, shop);
    await Log.create(shop, 'checkout_created', checkout, 'received');

    await sendToEasyClient(shop, {
      ...data.easyClientPayload,
      event: 'checkout_started',
    });

    res.status(200).send('OK');
  } catch (err) {
    console.error('checkoutCreated error:', err.message);
    res.status(500).send('Error');
  }
}

// POST /webhook/checkouts/update
async function checkoutUpdated(req, res) {
  const checkout = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  try {
    const data = webhookService.extractCheckoutPayload(checkout, shop);
    await Log.create(shop, 'checkout_updated', checkout, 'received');

    await sendToEasyClient(shop, {
      ...data.easyClientPayload,
      event: 'checkout_updated',
    });

    res.status(200).send('OK');
  } catch (err) {
    console.error('checkoutUpdated error:', err.message);
    res.status(500).send('Error');
  }
}

// POST /webhook/carts/create
async function cartCreated(req, res) {
  const cart = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  try {
    const data = webhookService.extractCartPayload(cart, shop);
    await Log.create(shop, 'cart_created', cart, 'received');

    await sendToEasyClient(shop, {
      ...data.easyClientPayload,
      event: 'cart_created',
    });

    res.status(200).send('OK');
  } catch (err) {
    console.error('cartCreated error:', err.message);
    res.status(500).send('Error: ' + err.message);
  }
}

// POST /webhook/carts/update
async function cartUpdated(req, res) {
  const cart = req.body;
  const shop = req.headers['x-shopify-shop-domain'];

  try {
    const data = webhookService.extractCartPayload(cart, shop);
    await Log.create(shop, 'cart_updated', cart, 'received');

    await sendToEasyClient(shop, {
      ...data.easyClientPayload,
      event: 'cart_updated',
    });

    res.status(200).send('OK');
  } catch (err) {
    console.error('cartUpdated error:', err.message);
    res.status(500).send('Error');
  }
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
