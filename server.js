const app = require('./app');

const PORT = process.env.PORT || 3001;

const Store = require('./models/Store');
const { registerWebhooks } = require('./services/shopify.service');

app.listen(PORT, async () => {
  console.log('======================================');
  console.log(` Shopify Plugin Backend`);
  console.log(` Running on http://localhost:${PORT}`);
  console.log('======================================');

  // Automatically sync webhooks for ALL stores on startup
  try {
    const stores = await Store.findAll();
    for (const store of stores) {
      if (store.is_active) {
        console.log(`Auto-syncing webhooks for ${store.shop_domain}...`);
        // We need the access token, which findAll doesn't include by default. 
        // Let's get the full store object.
        const fullStore = await Store.findByDomain(store.shop_domain);
        await registerWebhooks(store.shop_domain, fullStore.access_token);
      }
    }
  } catch (err) {
    console.error('Initial webhook sync failed:', err.message);
  }
});
