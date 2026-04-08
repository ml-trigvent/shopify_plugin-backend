function extractOrderPayload(order, shop) {
  const customerName = [
    order.customer?.first_name,
    order.customer?.last_name,
  ].filter(Boolean).join(' ') || 'Unknown';

  const phone =
    order.customer?.phone ||
    order.billing_address?.phone ||
    order.shipping_address?.phone ||
    '';

  const products = (order.line_items || []).map((i) => i.name).join(', ');

  const quantity = (order.line_items || []).reduce(
    (sum, i) => sum + (i.quantity || 0), 0
  );

  return {
    shopDomain: shop,
    shopifyOrderId: order.name,
    customerName: customerName.trim(),
    customerPhone: phone,
    customerEmail: order.customer?.email || '',
    productName: products,
    price: parseFloat(order.total_price || 0),
    quantity,
    // Easy Client payload format
    easyClientPayload: {
      name: customerName.trim(),
      phone,
      email: order.customer?.email || '',
      orderId: order.name,
      product: products,
      price: order.total_price,
      quantity,
    },
  };
}

function extractFulfillmentPayload(fulfillment, shop) {
  return {
    shopDomain: shop,
    shopifyOrderId: `#${fulfillment.order_id}`,
    trackingNumber: fulfillment.tracking_number || '',
    trackingUrl: fulfillment.tracking_url || '',
    status: fulfillment.status,
    easyClientPayload: {
      orderId: `#${fulfillment.order_id}`,
      trackingNumber: fulfillment.tracking_number || '',
      trackingUrl: fulfillment.tracking_url || '',
      event: 'order_shipped',
    },
  };
}

function extractCheckoutPayload(checkout, shop) {
  const customerName = [
    checkout.customer?.first_name,
    checkout.customer?.last_name,
  ].filter(Boolean).join(' ') || 'Unknown';

  const phone =
    checkout.customer?.phone ||
    checkout.billing_address?.phone ||
    checkout.shipping_address?.phone ||
    '';

  const products = (checkout.line_items || []).map((i) => i.title).join(', ');

  const quantity = (checkout.line_items || []).reduce(
    (sum, i) => sum + (i.quantity || 0), 0
  );

  return {
    shopDomain: shop,
    checkoutId: checkout.token,
    customerName: customerName.trim(),
    customerPhone: phone,
    customerEmail: checkout.customer?.email || checkout.email || '',
    productName: products,
    price: parseFloat(checkout.total_price || 0),
    quantity,
    easyClientPayload: {
      name: customerName.trim(),
      phone,
      email: checkout.customer?.email || checkout.email || '',
      checkoutId: checkout.token,
      product: products,
      price: checkout.total_price,
      quantity,
    },
  };
}

function extractCartPayload(cart, shop) {
  const products = (cart.line_items || []).map((i) => i.title || i.product_title).join(', ');

  const quantity = (cart.line_items || []).reduce(
    (sum, i) => sum + (i.quantity || 0), 0
  );

  const price = (cart.line_items || []).reduce(
    (sum, i) => sum + (parseFloat(i.price || 0) * (i.quantity || 0)), 0
  );

  return {
    shopDomain: shop,
    cartId: cart.id || cart.token,
    productName: products,
    price,
    quantity,
    easyClientPayload: {
      cartId: cart.id || cart.token,
      product: products,
      price,
      quantity,
    },
  };
}

module.exports = {
  extractOrderPayload,
  extractFulfillmentPayload,
  extractCheckoutPayload,
  extractCartPayload,
};
