// server.js
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();
const db = require('./config/db');



// Import routes
const { router: loanPredictionRouter } = require('./routes/loanPredictionDataForRound');
const DailyTimeRoutes = require('./routes/dailyTimeRoutes');
const frequencyCategoryRoutes = require('./routes/frequencyCategoryRoutes');
const gudianMembersRoutes = require('./routes/gudianMembersRoutes');
const userLoginRoutes = require('./routes/userLoginRoutes');
const ScheduleManagerRoutes = require('./routes/ScheduleManagerRoutes');
const supperAdminRoutes = require('./routes/supperAdminRoutes');
const ikiminaInfoRoutes = require('./routes/ikiminaInfoRoutes');
const WeeklyTimeRoutes = require('./routes/weeklyTimeRoutes');
const MonthlyTimeRoutes = require('./routes/monthlyTimeRoutes');
const LocationManagerRoutes = require('./routes/LocationManagerRoutes');
const memberTypeRoutes = require('./routes/memberTypeRoutes');
const membersInfoRoutes = require('./routes/membersInfoRoutes');
const ikiminaRoundRoutes = require('./routes/ikiminaRoundRoutes');
const savingManagementRoutes = require('./routes/savingManagementRoutes');
const slotsManagementRoutes = require('./routes/slotsManagementRoutes');
const savingRulesRoutes = require('./routes/savingRulesRoutes');
const LoanManagementRoutes = require('./routes/LoanManagementRoutes');
const loanPredictionRoutes = require('./routes/loanPredictionRoutes');



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'x-sad-id',
    'x-iki-id',
    'x-iki-name',
    'x-cell',
    'x-village',
    'x-sector',
    'Authorization',
    'x-f-id',
  ],
}));

// Middleware to parse JSON


app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf; // Save raw body buffer for signature verification
    },
  })
);

// Helper function: Update payment status in DB
async function updatePaymentStatusInDb(reference, newStatus) {
  await poolConnect();
  const request = pool.request();
  const result = await request
    .input('reference', sql.VarChar(100), reference)
    .input('status', sql.VarChar(50), newStatus)
    .query(`
      UPDATE member_saving_activities
      SET payment_status = @status
      WHERE momo_reference_id = @reference
    `);

  if (result.rowsAffected[0] === 0) {
    console.warn(`⚠️ No saving activity found with reference: ${reference}`);
  } else {
    console.log(`🔄 Payment status updated to '${newStatus}' for reference: ${reference}`);
  }
}

// Webhook route with signature verification and payment update + notification
app.post('/api/payment-webhook', async (req, res) => {
  try {
    const requestHash = req.get('X-Paypack-Signature');
    const secret = process.env.PAYPACK_WEBHOOK_SIGN_KEY;

    if (!requestHash || !secret) {
      console.error('Missing signature or secret');
      return res.status(400).json({ message: 'Missing signature or secret key.' });
    }

    // Create HMAC hash from rawBody
    const hash = crypto.createHmac('sha256', secret).update(req.rawBody).digest('base64');

    if (hash !== requestHash) {
      console.log('Signature is invalid, rejected');
      return res.status(401).json({ message: 'Invalid signature.' });
    }

    console.log('Webhook verified:', req.body);

    const { ref, status } = req.body;

    if (!ref || !status) {
      return res.status(400).json({ message: 'Invalid webhook payload. Missing ref or status.' });
    }

    const statusLower = status.toLowerCase();

    // Update payment status in DB
    await updatePaymentStatusInDb(ref, statusLower);

    // Fetch saving info for notification
    await poolConnect();
    const request = pool.request();
    const result = await request
      .input('reference', sql.VarChar(100), ref)
      .query(`
        SELECT member_id, phone_used, saved_amount, slot_id
        FROM member_saving_activities
        WHERE momo_reference_id = @reference
      `);

    if (result.recordset.length === 0) {
      console.warn(`⚠️ No saving activity found for webhook ref: ${ref}`);
      return res.status(200).json({ message: 'No matching saving activity.' });
    }

    const saving = result.recordset[0];

    // Notify member based on payment status
    if (statusLower === 'successful') {
      const sms = `Hello! Your saving of ${saving.saved_amount} RWF for slot ${saving.slot_id} has been confirmed successfully. Thank you!`;
      await sendCustomSms(saving.phone_used, sms);
      console.log(`✅ Notified member ${saving.member_id} of successful payment.`);
    } else if (statusLower === 'failed') {
      const sms = `Unfortunately, your saving payment for slot ${saving.slot_id} failed. Please try again.`;
      await sendCustomSms(saving.phone_used, sms);
      console.log(`❌ Notified member ${saving.member_id} of failed payment.`);
    } else {
      console.log(`ℹ️ Payment status '${statusLower}' received for ref ${ref}, no notification sent.`);
    }

    return res.status(200).json({ message: 'Webhook processed successfully.' });

  } catch (err) {
    console.error('❌ Error processing webhook:', err);
    return res.status(500).json({ message: 'Webhook error', error: err.message });
  }
});

// Import and run scheduler
require('./routes/roundStatusScheduler');

// Register routes
app.use('/api/userLoginRoutes', userLoginRoutes);
app.use('/api/supperAdminRoutes', supperAdminRoutes);
app.use('/api/ScheduleManagerRoutes', ScheduleManagerRoutes);
app.use('/api/frequencyCategoryRoutes', frequencyCategoryRoutes);
app.use('/api/ikiminaInfoRoutes', ikiminaInfoRoutes);
app.use('/api/DailyTimeRoutes', DailyTimeRoutes);
app.use('/api/LocationManagerRoutes', LocationManagerRoutes);
app.use('/api/WeeklyTimeRoutes', WeeklyTimeRoutes);
app.use('/api/MonthlyTimeRoutes', MonthlyTimeRoutes);
app.use('/api/memberTypeRoutes', memberTypeRoutes);
app.use('/api/gudianMembersRoutes', gudianMembersRoutes);
app.use('/api/membersInfoRoutes', membersInfoRoutes);
app.use('/api/ikiminaRoundRoutes', ikiminaRoundRoutes);
app.use('/api/savingManagementRoutes', savingManagementRoutes);
app.use('/api/slotsManagementRoutes', slotsManagementRoutes);
app.use('/api/savingRulesRoutes', savingRulesRoutes);
app.use('/api/loanPredictionDataForRound', loanPredictionRouter);
app.use('/api/loanPredictionRoutes', loanPredictionRoutes);
app.use('/api/loanManagementRoutes', LoanManagementRoutes);



// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
