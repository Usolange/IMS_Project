const express = require('express');
const axios = require('axios');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');

async function runQuery(query, params = []) {
  await poolConnect;
  const request = pool.request();
  params.forEach(({ name, type, value }) => {
    request.input(name, type, value);
  });
  const result = await request.query(query);
  return result.recordset || [];
}

// Fetch loan prediction input data for a member for active round only
router.get('/modalInputData/:member_id', async (req, res) => {
  const member_id = parseInt(req.params.member_id);
  console.log(`[modalInputData] Request received for member_id=${req.params.member_id}`);

  if (!member_id) {
    console.log('[modalInputData] Invalid member_id');
    return res.status(400).json({ message: 'Invalid member_id' });
  }

  try {
    // 1. Get iki_id for member
    const getIkiQuery = `
      SELECT iki_id
      FROM members_info
      WHERE member_id = @member_id
    `;
    const [member] = await runQuery(getIkiQuery, [
      { name: 'member_id', type: sql.Int, value: member_id }
    ]);

    if (!member) {
      console.log('[modalInputData] Member not found for member_id:', member_id);
      return res.status(404).json({ message: 'Member not found' });
    }

    const iki_id = member.iki_id;

    // 2. Get active round_id for this iki_id
    const getActiveRoundQuery = `
      SELECT TOP 1 round_id
      FROM ikimina_rounds
      WHERE iki_id = @iki_id AND round_status = 'active'
      ORDER BY start_date DESC
    `;
    const [activeRound] = await runQuery(getActiveRoundQuery, [
      { name: 'iki_id', type: sql.Int, value: iki_id }
    ]);

    if (!activeRound) {
      console.log('[modalInputData] No active round found for iki_id:', iki_id);
      return res.status(404).json({ message: 'No active round found' });
    }

    const activeRoundId = activeRound.round_id;

    // 3. Get latest loan prediction data for member and active round
    const query = `
      SELECT TOP (1)
        id,
        member_id,
         round_id, 
        saving_frequency,
        saving_times_per_period,
        total_saving_cycles,
        completed_saving_cycles,
        user_savings_made,
        total_current_saving,
        ikimina_created_year,
        member_Join_Year,
        recent_loan_payment_status,
        saving_status,
        has_guardian
      FROM ims_db.dbo.loan_prediction_data
      WHERE member_id = @member_id AND round_id = @round_id
      ORDER BY id DESC
    `;

    const [result] = await runQuery(query, [
      { name: 'member_id', type: sql.Int, value: member_id },
      { name: 'round_id', type: sql.Int, value: activeRoundId }
    ]);

    if (!result) {
      console.log(`[modalInputData] No loan prediction data found for member_id=${member_id} and round_id=${activeRoundId}`);
      return res.status(404).json({ message: 'No data found for member in active round' });
    }

    const modalData = {
      member_id: result.member_id,
      round_id: result.round_id,
      saving_frequency: result.saving_frequency,
      saving_times_per_period: result.saving_times_per_period,
      total_saving_cycles: result.total_saving_cycles,
      completed_saving_cycles: result.completed_saving_cycles,
      user_savings_made: result.user_savings_made,
      total_current_saving: result.total_current_saving,
      ikimina_created_year: result.ikimina_created_year,
      member_Join_Year: result.member_Join_Year,
      recent_loan_payment_status: result.recent_loan_payment_status,
      saving_status: result.saving_status,
      has_guardian: result.has_guardian === 1 || result.has_guardian === true
    };

    console.log('[modalInputData] Modal data fetched:', modalData);

    return res.json({ success: true, data: modalData });

  } catch (err) {
    console.error('[modalInputData] Error fetching data:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching modal input' });
  }
});


// Predict allowed loan for active round using modal input
router.get('/predictedAllowedLoan/:member_id', async (req, res) => {
  const member_id = parseInt(req.params.member_id);
  if (!member_id) return res.status(400).json({ message: 'Invalid member ID' });

  try {
    const modalInputRes = await axios.get(`http://localhost:5000/api/loanPredictionRoutes/modalInputData/${member_id}`);
    if (!modalInputRes.data.success) {
      return res.status(404).json({ message: 'Failed to get modal input data' });
    }

    const inputData = modalInputRes.data.data;

    // 🚫 Do not convert to 'daily', 'weekly', etc. Keep integer values as is
    const preparedData = {
      saving_times_per_period: Number(inputData.saving_times_per_period),
      saving_frequency: Number(inputData.saving_frequency), // 1=daily, 2=weekly, 3=monthly
      total_current_saving: Number(inputData.total_current_saving),
      completed_saving_cycles: Number(inputData.completed_saving_cycles),
      user_savings_made: Number(inputData.user_savings_made),
      has_guardian: inputData.has_guardian ? 1 : 0,
      recent_loan_payment_status: Number(inputData.recent_loan_payment_status), // 1=Poor, ..., 5=Excellent
      user_joined_year: Number(inputData.member_Join_Year),
      ikimina_created_year: Number(inputData.ikimina_created_year)
    };

    // 🔁 Send to Python model
    const predictionRes = await axios.post('http://localhost:5001/predict-loan', preparedData);
    const allowedLoan = predictionRes.data?.allowed_loan ?? 0;

    return res.json({ allowedLoan });

  } catch (error) {
    console.error('Live loan prediction failed:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Failed to get prediction from model' });
  }
});



// 1. Get all loans for a member
router.get('/selectLoans/:memberId', async (req, res) => {
  const memberId = parseInt(req.params.memberId);
  if (!memberId) return res.status(400).json({ message: 'Invalid member ID' });

  try {
    const query = `
      SELECT loan_id, member_id, iki_id, requested_amount, approved_amount,
             interest_rate, total_repayable, status, request_date,
             approval_date, disbursed_date, due_date, repayment_completed_date,
             phone_disbursed_to, created_at
      FROM loans
      WHERE member_id = @memberId
      ORDER BY request_date DESC
    `;
    const loans = await runQuery(query, [{ name: 'memberId', type: sql.Int, value: memberId }]) || [];
    console.log(`Fetched loans for memberId=${memberId}:`, loans);
    res.json({ loans });
  } catch (error) {
    console.error('GET /api/loanPredictionRoutes/selectLoans/:memberId error:', error);
    res.status(500).json({ message: 'Failed to fetch loans' });
  }
});

// 2. Get loan interest details for a loan
router.get('/loanInterest/:loanId', async (req, res) => {
  const loanId = parseInt(req.params.loanId);
  if (!loanId) return res.status(400).json({ message: 'Invalid loan ID' });

  try {
    const query = `
      SELECT interest_id, loan_id, interest_rate, interest_amount,
             calculated_on_date, due_date, is_paid, paid_date,
             created_at, payment_status, timing_status
      FROM loan_interest
      WHERE loan_id = @loanId
    `;
    const interests = await runQuery(query, [{ name: 'loanId', type: sql.Int, value: loanId }]) || [];
    console.log(`Fetched loan interests for loanId=${loanId}:`, interests);
    res.json({ interests });
  } catch (error) {
    console.error('GET /api/loanPredictionRoutes/loanInterest/:loanId error:', error);
    res.status(500).json({ message: 'Failed to fetch loan interest details' });
  }
});

// 3. Get loan repayments for a loan
router.get('/loanRepayments/:loanId', async (req, res) => {
  const loanId = parseInt(req.params.loanId);
  if (!loanId) return res.status(400).json({ message: 'Invalid loan ID' });

  try {
    const query = `
      SELECT repayment_id, loan_id, member_id, amount_paid, payment_method,
             phone_used, payment_date, is_full_payment, created_at,
             payment_status, timing_status
      FROM loan_repayments
      WHERE loan_id = @loanId
      ORDER BY payment_date DESC
    `;
    const repayments = await runQuery(query, [{ name: 'loanId', type: sql.Int, value: loanId }]) || [];
    console.log(`Fetched loan repayments for loanId=${loanId}:`, repayments);
    res.json({ repayments });
  } catch (error) {
    console.error('GET /api/loanPredictionRoutes/loanRepayments/:loanId error:', error);
    res.status(500).json({ message: 'Failed to fetch loan repayments' });
  }
});

// 4. Create a new loan request
router.post('/newLoan', async (req, res) => {
  const { member_id, round_id, requested_amount } = req.body;

  if (!member_id || !round_id || !requested_amount) {
    return res.status(400).json({ message: 'Missing required fields: member_id, round_id, requested_amount' });
  }

  try {
    // Validate requested_amount is positive number
    const amountNum = parseFloat(requested_amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: 'Invalid requested amount' });
    }

    // Check if there is already an active loan request for this member and round that is pending or approved
    const existingQuery = `
      SELECT loan_id, status FROM loans
      WHERE member_id = @member_id AND round_id = @round_id
      AND status IN ('pending', 'approved')
    `;
    const existingLoans = await runQuery(existingQuery, [
      { name: 'member_id', type: sql.Int, value: member_id },
      { name: 'round_id', type: sql.Int, value: round_id }
    ]);

    if (existingLoans.length > 0) {
      return res.status(409).json({ message: 'Existing loan request already pending or approved for this round.' });
    }

    // Insert new loan request with status 'pending'
    const insertQuery = `
      INSERT INTO loans
      (member_id, round_id, requested_amount, status, request_date, created_at)
      VALUES
      (@member_id, @round_id, @requested_amount, 'pending', GETDATE(), GETDATE());

      SELECT SCOPE_IDENTITY() AS newLoanId;
    `;

    await poolConnect;
    const request = pool.request();
    request.input('member_id', sql.Int, member_id);
    request.input('round_id', sql.Int, round_id);
    request.input('requested_amount', sql.Decimal(18, 2), amountNum);

    const result = await request.query(insertQuery);
    const newLoanId = result.recordset[0].newLoanId;

    res.status(201).json({ message: 'Loan request created successfully', loan_id: newLoanId });
  } catch (error) {
    console.error('POST /api/loans error:', error);
    res.status(500).json({ message: 'Failed to create loan request' });
  }
});

module.exports = router;
