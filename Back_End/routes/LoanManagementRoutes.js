
const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');

// Utility for running queries
async function runQuery(query, params = []) {
  await poolConnect;
  const request = pool.request();
  params.forEach(({ name, type, value }) => request.input(name, type, value));
  const result = await request.query(query);
  return result.recordset;
}

/* ==================== LOANS ==================== */

// Create loan
router.post('/loans', async (req, res) => {
  const {
    member_id, iki_id, requested_amount, approved_amount,
    interest_rate, total_repayable, status,
    request_date, approval_date, disbursed_date,
    due_date, repayment_completed_date,
    phone_disbursed_to, round_id
  } = req.body;

  try {
    const query = `
      INSERT INTO loans (
        member_id, iki_id, requested_amount, approved_amount,
        interest_rate, total_repayable, status,
        request_date, approval_date, disbursed_date,
        due_date, repayment_completed_date,
        phone_disbursed_to, created_at, round_id
      )
      VALUES (
        @member_id, @iki_id, @requested_amount, @approved_amount,
        @interest_rate, @total_repayable, @status,
        @request_date, @approval_date, @disbursed_date,
        @due_date, @repayment_completed_date,
        @phone_disbursed_to, GETDATE(), @round_id
      )
    `;

    await runQuery(query, [
      { name: 'member_id', type: sql.Int, value: member_id },
      { name: 'iki_id', type: sql.Int, value: iki_id },
      { name: 'requested_amount', type: sql.Decimal(10, 2), value: requested_amount },
      { name: 'approved_amount', type: sql.Decimal(10, 2), value: approved_amount },
      { name: 'interest_rate', type: sql.Decimal(5, 2), value: interest_rate },
      { name: 'total_repayable', type: sql.Decimal(10, 2), value: total_repayable },
      { name: 'status', type: sql.VarChar(50), value: status },
      { name: 'request_date', type: sql.DateTime, value: request_date },
      { name: 'approval_date', type: sql.DateTime, value: approval_date },
      { name: 'disbursed_date', type: sql.DateTime, value: disbursed_date },
      { name: 'due_date', type: sql.DateTime, value: due_date },
      { name: 'repayment_completed_date', type: sql.DateTime, value: repayment_completed_date },
      { name: 'phone_disbursed_to', type: sql.VarChar(20), value: phone_disbursed_to },
      { name: 'round_id', type: sql.Int, value: round_id }
    ]);

    res.json({ message: 'Loan created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all loans
router.get('/loans', async (req, res) => {
  try {
    const result = await runQuery('SELECT * FROM loans ORDER BY created_at DESC');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get loan by ID
router.get('/loans/:loan_id', async (req, res) => {
  try {
    const result = await runQuery('SELECT * FROM loans WHERE loan_id = @loan_id', [
      { name: 'loan_id', type: sql.Int, value: req.params.loan_id }
    ]);
    res.json(result[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete loan
router.delete('/loans/:loan_id', async (req, res) => {
  try {
    await runQuery('DELETE FROM loans WHERE loan_id = @loan_id', [
      { name: 'loan_id', type: sql.Int, value: req.params.loan_id }
    ]);
    res.json({ message: 'Loan deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================== REPAYMENTS ==================== */

// Add repayment
router.post('/repayments', async (req, res) => {
  const {
    loan_id, member_id, amount_paid,
    payment_method, phone_used, payment_date,
    is_full_payment, payment_status, timing_status
  } = req.body;

  try {
    const query = `
      INSERT INTO loan_repayments (
        loan_id, member_id, amount_paid,
        payment_method, phone_used, payment_date,
        is_full_payment, created_at, payment_status, timing_status
      )
      VALUES (
        @loan_id, @member_id, @amount_paid,
        @payment_method, @phone_used, @payment_date,
        @is_full_payment, GETDATE(), @payment_status, @timing_status
      )
    `;

    await runQuery(query, [
      { name: 'loan_id', type: sql.Int, value: loan_id },
      { name: 'member_id', type: sql.Int, value: member_id },
      { name: 'amount_paid', type: sql.Decimal(10, 2), value: amount_paid },
      { name: 'payment_method', type: sql.VarChar(50), value: payment_method },
      { name: 'phone_used', type: sql.VarChar(20), value: phone_used },
      { name: 'payment_date', type: sql.DateTime, value: payment_date },
      { name: 'is_full_payment', type: sql.Bit, value: is_full_payment },
      { name: 'payment_status', type: sql.VarChar(50), value: payment_status },
      { name: 'timing_status', type: sql.VarChar(50), value: timing_status }
    ]);

    res.json({ message: 'Repayment recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get repayments by loan ID
router.get('/repayments/:loan_id', async (req, res) => {
  try {
    const result = await runQuery(
      'SELECT * FROM loan_repayments WHERE loan_id = @loan_id ORDER BY created_at ASC',
      [{ name: 'loan_id', type: sql.Int, value: req.params.loan_id }]
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================== INTEREST ==================== */

// Add interest
router.post('/interests', async (req, res) => {
  const {
    loan_id, interest_rate, interest_amount,
    calculated_on_date, due_date,
    is_paid, paid_date, payment_status, timing_status
  } = req.body;

  try {
    const query = `
      INSERT INTO loan_interest (
        loan_id, interest_rate, interest_amount,
        calculated_on_date, due_date,
        is_paid, paid_date, created_at,
        payment_status, timing_status
      )
      VALUES (
        @loan_id, @interest_rate, @interest_amount,
        @calculated_on_date, @due_date,
        @is_paid, @paid_date, GETDATE(),
        @payment_status, @timing_status
      )
    `;

    await runQuery(query, [
      { name: 'loan_id', type: sql.Int, value: loan_id },
      { name: 'interest_rate', type: sql.Decimal(5, 2), value: interest_rate },
      { name: 'interest_amount', type: sql.Decimal(10, 2), value: interest_amount },
      { name: 'calculated_on_date', type: sql.DateTime, value: calculated_on_date },
      { name: 'due_date', type: sql.DateTime, value: due_date },
      { name: 'is_paid', type: sql.Bit, value: is_paid },
      { name: 'paid_date', type: sql.DateTime, value: paid_date },
      { name: 'payment_status', type: sql.VarChar(50), value: payment_status },
      { name: 'timing_status', type: sql.VarChar(50), value: timing_status }
    ]);

    res.json({ message: 'Interest added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get interest by loan ID
router.get('/interests/:loan_id', async (req, res) => {
  try {
    const result = await runQuery(
      'SELECT * FROM loan_interest WHERE loan_id = @loan_id ORDER BY created_at ASC',
      [{ name: 'loan_id', type: sql.Int, value: req.params.loan_id }]
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
