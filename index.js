require('dotenv').config();
const express = require('express');
const cors = require('cors');
const paymentRoutes = require('./routes/payment');

const app = express();

// 1. CORS first
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));

// IMPORTANT: Raw body for webhook MUST come BEFORE express.json()
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// 2. JSON body parser (this is the important one)
app.use(express.json());
app.use(express.static('public'));

// 3. Your routes
app.use('/api/payment', paymentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Paystack Payment Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});