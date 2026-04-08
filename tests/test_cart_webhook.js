const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;

async function testCartWebhook() {
    const payload = {
        id: 'test_cart_123',
        token: 'test_token_123',
        line_items: [
            {
                id: 1,
                title: 'Awesome T-Shirt',
                quantity: 2,
                price: '25.00'
            }
        ]
    };

    const body = JSON.stringify(payload);
    const hmac = crypto
        .createHmac('sha256', SHOPIFY_API_SECRET)
        .update(body, 'utf8')
        .digest('base64');

    try {
        console.log('Sending mock carts/create webhook...');
        const res = await axios.post(`${APP_URL}/webhook/carts/create`, payload, {
            headers: {
                'X-Shopify-Topic': 'carts/create',
                'X-Shopify-Hmac-Sha256': hmac,
                'X-Shopify-Shop-Domain': 'easy-client-test-shop.myshopify.com',
                'Content-Type': 'application/json'
            }
        });
        console.log('Response:', res.status, res.data);
    } catch (err) {
        console.error('Error:', err.response?.status, err.response?.data || err.message);
    }
}

testCartWebhook();
