const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = 'https://api.paystack.co';

// Helper function for Paystack API calls
async function paystackRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Paystack request failed');
  }

  return data;
}

/**
 * 1. Initialize a transaction
 * POST /api/payment/initialize
 * Body: { email, amount, metadata? }
 * Amount should be in the main currency unit (e.g. 100 for ₦100)
 */
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, metadata = {} } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: 'Email and amount are required' });
    }

    // Convert to kobo/pesewas/cents (smallest unit)
    const amountInSubunit = Math.round(Number(amount) * 100);

    const data = await paystackRequest('/transaction/initialize', 'POST', {
      email,
      amount: amountInSubunit,
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`, // optional
      metadata,
      currency: 'ZAR', // optional – defaults to your integration currency
    });

    res.status(200).json({
      success: true,
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error('Initialize error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2. Verify a transaction
 * GET /api/payment/verify/:reference
 */
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    const data = await paystackRequest(`/transaction/verify/${reference}`);

    // Always check the status on your server
    if (data.data.status === 'success') {
      // TODO: Update your database – mark order as paid
      // Example: await Order.findOneAndUpdate({ reference }, { status: 'paid' });

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: data.data,
      });
    }

    res.status(400).json({
      success: false,
      message: 'Payment not successful',
      data: data.data,
    });
  } catch (error) {
    console.error('Verify error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. Webhook
 * POST /api/payment/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];

    if (!signature) {
      return res.status(400).send('No signature');
    }

    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(req.body)
      .digest('hex');

    if (hash !== signature) {
      console.log('Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }

    const event = JSON.parse(req.body.toString());

    console.log('Webhook Event Received:', event.event);

    // Handle successful payment
    if (event.event === 'charge.success') {
      const data = event.data;

      console.log('Payment Successful!');
      console.log('Reference:', data.reference);
      console.log('Amount:', data.amount / 100);
      console.log('Customer Email:', data.customer.email);

      // TODO: Later you will update your database here
      // Example: mark order as paid using data.reference
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.sendStatus(500);
  }
});

module.exports = router;