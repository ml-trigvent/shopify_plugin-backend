-- Run this file in MySQL to set up the database
-- mysql -u root -p < config/database.sql

CREATE DATABASE IF NOT EXISTS shopify_plugin;
USE shopify_plugin;

-- Stores table: one row per installed Shopify store
CREATE TABLE IF NOT EXISTS stores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL UNIQUE,
  access_token VARCHAR(500) NOT NULL,
  easy_client_api_key VARCHAR(500) DEFAULT NULL,
  event_preferences JSON DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders table: captured from Shopify webhooks
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL,
  shopify_order_id VARCHAR(100),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  product_name TEXT,
  price DECIMAL(10,2),
  quantity INT DEFAULT 1,
  status VARCHAR(100) DEFAULT 'placed',
  tracking_number VARCHAR(255) DEFAULT NULL,
  delivery_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shop (shop_domain),
  INDEX idx_order_id (shopify_order_id)
);

-- Logs table: every webhook event and Easy Client API call
CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_domain VARCHAR(255),
  event_type VARCHAR(100),
  payload JSON,
  status VARCHAR(50) DEFAULT 'received',
  response TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shop_logs (shop_domain)
);
