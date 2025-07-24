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
// router.get('/predictedAllowedLoan/:member_id', async (req, res) => {
//   const member_id = parseInt(req.params.member_id);
//   if (!member_id) return res.status(400).json({ message: 'Invalid member ID' });

//   try {
//     const modalInputRes = await axios.get(`http://localhost:5000/api/loanPredictionRoutes/modalInputData/${member_id}`);
//     if (!modalInputRes.data.success) {
//       return res.status(404).json({ message: 'Failed to get modal input data' });
//     }

//     const inputData = modalInputRes.data.data;

//     // 🚫 Do not convert to 'daily', 'weekly', etc. Keep integer values as is
//     const preparedData = {
//       saving_times_per_period: Number(inputData.saving_times_per_period),
//       saving_frequency: Number(inputData.saving_frequency), // 1=daily, 2=weekly, 3=monthly
//       total_current_saving: Number(inputData.total_current_saving),
//       completed_saving_cycles: Number(inputData.completed_saving_cycles),
//       user_savings_made: Number(inputData.user_savings_made),
//       has_guardian: inputData.has_guardian ? 1 : 0,
//       recent_loan_payment_status: Number(inputData.recent_loan_payment_status), // 1=Poor, ..., 5=Excellent
//       user_joined_year: Number(inputData.member_Join_Year),
//       ikimina_created_year: Number(inputData.ikimina_created_year)
//     };

//     // 🔁 Send to Python model
//     const predictionRes = await axios.post('http://localhost:5001/predict-loan', preparedData);
//     const allowedLoan = predictionRes.data?.allowed_loan ?? 0;

//     return res.json({ allowedLoan });

//   } catch (error) {
//     console.error('Live loan prediction failed:', error.response?.data || error.message);
//     return res.status(500).json({ message: 'Failed to get prediction from model' });
//   }
// });


// Predict allowed loan for active round using modal input
router.get('/predictedAllowedLoan/:member_id', async (req, res) => {
  const member_id = parseInt(req.params.member_id);
  if (!member_id) return res.status(400).json({ message: 'Invalid member ID' });

  try {
    // Fetch modal input data for the member
    const modalInputRes = await axios.get(`http://localhost:5000/api/loanPredictionRoutes/modalInputData/${member_id}`);
    if (!modalInputRes.data.success) {
      return res.status(404).json({ message: 'Failed to get modal input data' });
    }

    const inputData = modalInputRes.data.data;

    // Helper to safely convert to number with default 0
    const toNumberSafe = (val, defaultValue = 0) => {
      const n = Number(val);
      return isNaN(n) ? defaultValue : n;
    };

    // Prepare all required fields for model input
    const preparedData = {
      saving_times_per_period: toNumberSafe(inputData.saving_times_per_period),
      saving_frequency: toNumberSafe(inputData.saving_frequency),           // 1=daily, 2=weekly, 3=monthly
      total_current_saving: toNumberSafe(inputData.total_current_saving),
      total_saving_cycles: toNumberSafe(inputData.total_saving_cycles),      // <-- Make sure this is included
      completed_saving_cycles: toNumberSafe(inputData.completed_saving_cycles),
      user_savings_made: toNumberSafe(inputData.user_savings_made),
      has_guardian: inputData.has_guardian ? 1 : 0,
      recent_loan_payment_status: toNumberSafe(inputData.recent_loan_payment_status),
      user_joined_year: toNumberSafe(inputData.member_Join_Year),
      ikimina_created_year: toNumberSafe(inputData.ikimina_created_year)
    };

    // Validate ranges (optional but recommended)
    if (
      preparedData.saving_times_per_period < 0 ||
      preparedData.saving_frequency < 1 || preparedData.saving_frequency > 3 ||
      preparedData.total_current_saving < 0 ||
      preparedData.total_saving_cycles < 0 ||
      preparedData.completed_saving_cycles < 0 ||
      preparedData.user_savings_made < 0 ||
      preparedData.recent_loan_payment_status < 0 || preparedData.recent_loan_payment_status > 4 ||
      preparedData.user_joined_year < 1900 ||
      preparedData.ikimina_created_year < 1900
    ) {
      return res.status(400).json({ message: 'Invalid input data ranges detected' });
    }

    // Send prepared data to Flask prediction API
    const predictionRes = await axios.post('http://localhost:5001/predict-loan', preparedData);
    const allowedLoan = predictionRes.data?.allowed_loan ?? 0;

    return res.json({ allowedLoan });

  } catch (error) {
    console.error('Live loan prediction failed:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Failed to get prediction from model' });
  }
});

module.exports = router;
