// server.js - Backend server for handling orders, products, and user data
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// File paths
const ordersFilePath = 'data/Orders.json';
const productsFilePath = 'data/Products.json';
const usersFilePath = 'data/Users.json';

// API to get all products
app.get('/api/products', (req, res) => {
  try {
    const data = fs.readFileSync(productsFilePath, 'utf8');
    const products = JSON.parse(data);
    res.json(products);
  } catch (e) {
    console.error('Error reading products data:', e);
    res.status(500).json({ error: 'Failed to load products data' });
  }
});

// API to save a confirmed order to Orders.json
app.post('/api/save-order', (req, res) => {
  try {
    const order = req.body;
    const data = fs.readFileSync(ordersFilePath, 'utf8');
    const ordersData = JSON.parse(data);
    
    // Only save CONFIRMED orders
    if (order.status !== 'confirmed') {
      return res.status(400).json({ error: 'Only confirmed orders can be saved' });
    }
    
    if (!order.orderNumber) {
      return res.status(400).json({ error: 'Order number is required' });
    }
    
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
      message: 'Confirmed order saved to Orders.json',
      orderNumber: order.orderNumber
    });
  } catch (e) {
    console.error('Error saving confirmed order:', e);
    res.status(500).json({ error: 'Failed to save confirmed order', details: e.message });
  }
});

// API to get order by order number
app.get('/api/orders/:orderNumber', (req, res) => {
  const { orderNumber } = req.params;
  try {
    const data = fs.readFileSync(ordersFilePath, 'utf8');
    const ordersData = JSON.parse(data);
    const order = ordersData.orders.find(o => o.orderNumber === orderNumber);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (e) {
    console.error('Error reading order data:', e);
    res.status(500).json({ error: 'Failed to load order data' });
  }
});

// API to get user profile
app.get('/api/users/:email', (req, res) => {
  const { email } = req.params;
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    const usersData = JSON.parse(data);
    const user = usersData.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (e) {
    console.error('Error reading user data:', e);
    res.status(500).json({ error: 'Failed to load user data' });
  }
});

// API to save user profile
app.post('/api/users', (req, res) => {
  try {
    const user = req.body;
    const data = fs.readFileSync(usersFilePath, 'utf8');
    const usersData = JSON.parse(data);
    
    const existingIndex = usersData.users.findIndex(u => u.email === user.email);
    
    if (existingIndex >= 0) {
      usersData.users[existingIndex] = {
        ...usersData.users[existingIndex],
        ...user
      };
    } else {
      usersData.users.push(user);
    }
    
    fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2));
    
    res.json({
      success: true,
      message: 'User profile saved',
      email: user.email
    });
  } catch (e) {
    console.error('Error saving user profile:', e);
    res.status(500).json({ error: 'Failed to save user profile', details: e.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});