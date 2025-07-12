const express = require('express');
const mysql = require('mysql2/promise');
const { spawnSync } = require('child_process');
const path = require('path');

const router = express.Router();

// Setup MySQL pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ims_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function runPythonPrediction(inputData) {
  const pythonScriptPath = path.resolve(__dirname, '../predict_loan.py');
  const inputJson = JSON.stringify(inputData);

  const result = spawnSync('python3', [pythonScriptPath, inputJson], {
    encoding: 'utf-8',
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Python script error: ${result.stderr}`);
  }

  return JSON.parse(result.stdout);
}

// POST /api/loan/predict
router.post('/predict', async (req, res) => {
  const data = req.body;

  const requiredFields = [
    'maccess_id', 'saving_frequency', 'saving_times_per_period', 'total_current_saving',
    'completed_saving_cycles', 'user_savings_made', 'employment_status',
    'has_guardian', 'recent_loan_payment_status', 'user_joined_year',
    'ikimina_created_year', 'user_age', 'model_choice'
  ];

  const missing = requiredFields.filter(f => !(f in data));
  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  }

  try {
    const predictionResult = runPythonPrediction(data);

    const conn = await pool.getConnection();
    const insertSQL = `
      INSERT INTO loan_pridict_data
      (maccess_id, SavingTimesPerPeriod, TotalSavingCycles, CompletedSavingCycles,
       UserSavingsMade, TotalCurrentSaving, IkiminaCreatedYear, UserJoinedYear, Age,
       HasGuardian, IsEmployed, SavingFrequency, RecentLoanPaymentStatus, ModelChoice, AllowedLoan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await conn.execute(insertSQL, [
      data.maccess_id,
      parseInt(data.saving_times_per_period),
      parseInt(data.saving_times_per_period) * (data.saving_frequency === 'daily' ? 365 : data.saving_frequency === 'weekly' ? 52 : 12),
      parseInt(data.completed_saving_cycles),
      parseInt(data.user_savings_made),
      parseFloat(data.total_current_saving),
      parseInt(data.ikimina_created_year),
      parseInt(data.user_joined_year),
      parseInt(data.user_age),
      data.has_guardian ? 1 : 0,
      data.employment_status === 'employed' ? 1 : 0,
      data.saving_frequency,
      data.recent_loan_payment_status,
      data.model_choice,
      parseFloat(predictionResult.allowed_loan)
    ]);
    conn.release();

    res.json({
      allowed_loan: predictionResult.allowed_loan,
      message: predictionResult.message,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/loan/latest/:maccess_id
router.get('/latest/:maccess_id', async (req, res) => {
  const { maccess_id } = req.params;

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
      `SELECT AllowedLoan, created_at, ModelChoice 
       FROM loan_pridict_data WHERE maccess_id = ? 
       ORDER BY created_at DESC LIMIT 1`, [maccess_id]
    );
    conn.release();

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No prediction found for this user.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
