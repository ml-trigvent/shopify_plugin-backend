const axios = require('axios');
const Store = require('../models/Store');
const Log = require('../models/Log');

async function sendToEasyClient(shopDomain, payload) {
  const config = await Store.getEasyClientConfig(shopDomain);

  if (!config || !config.easy_client_api_key) {
    console.warn(`No Easy Client API key for shop: ${shopDomain}`);
    await Log.create(shopDomain, payload.event, payload, 'skipped', 'No API key configured');
    return { success: false, reason: 'No API key configured' };
  }

  const apiKey = config.easy_client_api_key;
  const prefs = config.event_preferences || {};

  if (prefs[payload.event] === false) {
    console.log(`Skipping Event [${payload.event}] for shop: ${shopDomain} (User Preference)`);
    await Log.create(shopDomain, payload.event, payload, 'skipped', 'Disabled in settings');
    return { success: true, reason: 'Disabled in settings' };
  }

  if (!process.env.EASY_CLIENT_API_URL || process.env.EASY_CLIENT_API_URL.includes('api.easyclient.com')) {
    console.log(`Skipping Easy Client sync (placeholder URL) for shop: ${shopDomain}`);
    return { success: false, reason: 'Placeholder URL' };
  }

  try {
    const response = await axios.post(
      `${process.env.EASY_CLIENT_API_URL}/send`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    await Log.create(
      shopDomain,
      payload.event,
      payload,
      'success',
      JSON.stringify(response.data)
    );

    console.log(`Easy Client sent [${payload.event}] for shop: ${shopDomain}`);
    return { success: true, data: response.data };

  } catch (err) {
    const errMsg = err.response?.data || err.message;
    await Log.create(
      shopDomain,
      payload.event,
      payload,
      'failed',
      JSON.stringify(errMsg)
    );
    console.error(`Easy Client failed [${payload.event}]:`, errMsg);
    return { success: false, error: errMsg };
  }
}

module.exports = { sendToEasyClient };
