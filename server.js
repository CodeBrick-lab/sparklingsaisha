const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'sparklingsaisha')));

// Path to Orders.json
const ordersFilePath = path.join(__dirname, 'sparklingsaisha', 'Orders.json');

// Initialize Orders.json if it doesn't exist
function initializeOrdersFile() {
  if (!fs.existsSync(ordersFilePath)) {
    fs.writeFileSync(ordersFilePath, JSON.stringify({ orders: [] }, null, 2));
  }
}

initializeOrdersFile();

// Get all orders
app.get('/api/orders', (req, res) => {
  try {
    const data = fs.readFileSync(ordersFilePath, 'utf8');
    const ordersData = JSON.parse(data);
    res.json(ordersData);
  } catch (e) {
    console.error('Error reading Orders.json:', e);
    res.json({ orders: [] });
  }
});

// Save a new order
app.post('/api/orders', (req, res) => {
  try {
    const orderData = req.body;
    const data = fs.readFileSync(ordersFilePath, 'utf8');
    const ordersData = JSON.parse(data);
    
    // Ensure order has required fields
    if (!orderData.orderNumber) {
      return res.status(400).json({ error: 'Order number is required' });
    }
    
    // Check if order already exists
    const existingIndex = ordersData.orders.findIndex(o => o.orderNumber === orderData.orderNumber);
    
    if (existingIndex >= 0) {
      // Update existing order
      ordersData.orders[existingIndex] = {
        ...ordersData.orders[existingIndex],
        ...orderData,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new order
      ordersData.orders.push({
        ...orderData,
        createdAt: new Date().toISOString()
      });
    }
    
    fs.writeFileSync(ordersFilePath, JSON.stringify(ordersData, null, 2));
    
    res.json({
      success: true,
      message: 'Order saved successfully',
      orderNumber: orderData.orderNumber,
      order: ordersData.orders[existingIndex >= 0 ? existingIndex : ordersData.orders.length - 1]
    });
  } catch (e) {
    console.error('Error saving order:', e);
    res.status(500).json({ error: 'Failed to save order', details: e.message });
  }
});

// Save order confirmation (when payment is completed)
app.post('/api/save-order', (req, res) => {
  try {
    const order = req.body;
    const data = fs.readFileSync(ordersFilePath, 'utf8');
    const ordersData = JSON.parse(data);
    
    const existingIndex = ordersData.orders.findIndex(o => o.orderNumber === order.orderNumber);
    
    if (existingIndex >= 0) {
      ordersData.orders[existingIndex] = {
        ...ordersData.orders[existingIndex],
        ...order,
        confirmedAt: new Date().toISOString()
      };
    } else {
      ordersData.orders.push({
        ...order,
        confirmedAt: new Date().toISOString()
      });
    }
    
    fs.writeFileSync(ordersFilePath, JSON.stringify(ordersData, null, 2));
    
    res.json({
      success: true,
      message: 'Order confirmed and saved',
      orderNumber: order.orderNumber
    });
  } catch (e) {
    console.error('Error confirming order:', e);
    res.status(500).json({ error: 'Failed to confirm order', details: e.message });
  }
});

// Get order by order number
app.get('/api/orders/:orderNumber', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const data = fs.readFileSync(ordersFilePath, 'utf8');
    const ordersData = JSON.parse(data);
    
    const order = ordersData.orders.find(o => o.orderNumber === orderNumber);
    
    if (order) {
      res.json({ success: true, order });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (e) {
    console.error('Error fetching order:', e);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', port: PORT });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SparklingSaisha server running on http://localhost:${PORT}`);
  console.log(`📁 Orders file: ${ordersFilePath}`);
});
