const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');

async function runQuery(query, params = []) {
  await poolConnect;
  const request = pool.request();
  params.forEach(({ name, type, value }) => request.input(name, type, value));
  const result = await request.query(query);
  return result.recordset;
}

function parseId(id) {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) throw new Error('Invalid ID parameter');
  return parsed;
}

// GET Ikimina Info
router.get('/ikiminaInfo/:iki_id', async (req, res) => {
  try {
    const iki_id = parseId(req.params.iki_id);

    const query = `
      SELECT iki_id, iki_name, iki_email, iki_username, location_id, f_id
      FROM ikimina_info
      WHERE iki_id = @iki_id
    `;

    const result = await runQuery(query, [
      { name: 'iki_id', type: sql.Int, value: iki_id }
    ]);

    if (!result.length) {
      return res.status(404).json({ message: 'Ikimina not found' });
    }

    res.json(result[0]);
  } catch (err) {
    console.error('[ikiminaInfo] Error:', err.message || err);
    res.status(400).json({ message: err.message || 'Invalid request' });
  }
});

const log = (label, data) => {
  console.log(`[${label}]`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
};

// GET Rules for Selected Round (include interest_rate_percent)
router.get('/getRulesForSelectedRound/:iki_id/:round_id', async (req, res) => {
  try {
    const iki_id = parseId(req.params.iki_id);
    const round_id = parseId(req.params.round_id);

    log('getRulesForSelectedRound ▶️ iki_id', iki_id);
    log('getRulesForSelectedRound ▶️ round_id', round_id);

    const result = await pool
      .request()
      .input('iki_id', sql.Int, iki_id)
      .input('round_id', sql.Int, round_id)
      .query(`
        SELECT saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes, interest_rate_percent
        FROM ikimina_saving_rules
        WHERE iki_id = @iki_id AND round_id = @round_id
      `);

    if (result.recordset.length === 0) {
      log('getRulesForSelectedRound ⚠️ No rules found', {});
      return res.status(200).json({});
    }

    log('getRulesForSelectedRound ✅ Found', result.recordset[0]);
    res.json(result.recordset[0]);

  } catch (err) {
    console.error('[getRulesForSelectedRound] ❌ Error:', err.message || err);
    res.status(400).json({ message: err.message || 'Invalid request' });
  }
});

// GET round status info
router.get('/roundInfo/:iki_id/:round_id', async (req, res) => {
  const { iki_id, round_id } = req.params;

  try {
    const [result] = await db.query(
      `SELECT round_status FROM round WHERE f_ikimina_id = ? AND round_id = ?`,
      [iki_id, round_id]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: 'Round not found for this Ikimina.' });
    }

    res.json({ round_status: result[0].round_status });
  } catch (err) {
    console.error('Error fetching round info:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// GET Active Round and Rules (selectRules) with interest_rate_percent
router.get('/selectRules/:iki_id', async (req, res) => {
  try {
    const iki_id = parseId(req.params.iki_id);
    log('selectRules 🔍 iki_id', iki_id);

    const roundQuery = `
      SELECT TOP 1 round_id, round_year, start_date, end_date
      FROM ikimina_rounds 
      WHERE iki_id = @iki_id AND round_status = 'active' 
      ORDER BY round_id DESC`;

    const roundRows = await runQuery(roundQuery, [
      { name: 'iki_id', type: sql.Int, value: iki_id }
    ]);

    if (!roundRows.length) {
      log('selectRules ℹ️ No active round found', {});
      return res.status(200).json({});
    }

    const round = roundRows[0];
    log('selectRules ✅ Active Round Found', round);

    const rulesQuery = `
      SELECT saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes, interest_rate_percent
      FROM ikimina_saving_rules
      WHERE iki_id = @iki_id AND round_id = @round_id`;

    const rules = await runQuery(rulesQuery, [
      { name: 'iki_id', type: sql.Int, value: iki_id },
      { name: 'round_id', type: sql.Int, value: round.round_id }
    ]);

    if (!rules.length) {
      log(`selectRules ⚠️ No rules found for round_id: ${round.round_id}`, {});
      return res.status(200).json({ round });
    }

    const responsePayload = { round, rules: rules[0] };
    log('selectRules 🚀 Sending Response', responsePayload);
    res.json(responsePayload);

  } catch (err) {
    console.error('[selectRules] ❌ Error:', err.message || err);
    res.status(400).json({ message: err.message || 'Invalid request' });
  }
});

// GET Completed Rounds
router.get('/completedRounds/:iki_id', async (req, res) => {
  try {
    const iki_id = parseId(req.params.iki_id);
    log('completedRounds 🔍 iki_id', iki_id);

    const roundsQuery = `
      SELECT round_id, round_year, start_date, end_date
      FROM ikimina_rounds
      WHERE iki_id = @iki_id AND round_status = 'completed'
      ORDER BY end_date DESC`;

    const rounds = await runQuery(roundsQuery, [
      { name: 'iki_id', type: sql.Int, value: iki_id }
    ]);

    log('completedRounds ✅ Found', rounds);
    res.json(rounds);

  } catch (err) {
    console.error('[completedRounds] ❌ Error:', err.message || err);
    res.status(400).json({ message: err.message || 'Invalid request' });
  }
});

// GET Upcoming Rounds
router.get('/upcomingRounds/:iki_id', async (req, res) => {
  try {
    const iki_id = parseId(req.params.iki_id);
    log('upcomingRounds 🔍 iki_id', iki_id);

    const roundsQuery = `
      SELECT round_id, round_year, start_date, end_date
      FROM ikimina_rounds
      WHERE iki_id = @iki_id AND round_status = 'upcoming'
      ORDER BY start_date ASC`;

    const rounds = await runQuery(roundsQuery, [
      { name: 'iki_id', type: sql.Int, value: iki_id }
    ]);

    log('upcomingRounds ✅ Found', rounds);
    res.json(rounds);

  } catch (err) {
    console.error('[upcomingRounds] ❌ Error:', err.message || err);
    res.status(400).json({ message: err.message || 'Invalid request' });
  }
});

// newRules route (insert or update with interest_rate_percent)
router.put('/newRules/:iki_id', async (req, res) => {
  const iki_id = parseId(req.params.iki_id);
  const {
    round_id,
    saving_ratio,
    time_delay_penalty,
    date_delay_penalty,
    time_limit_minutes,
    interest_rate_percent,
  } = req.body;

  if (
    !round_id ||
    saving_ratio === undefined ||
    time_delay_penalty === undefined ||
    date_delay_penalty === undefined ||
    time_limit_minutes === undefined ||
    interest_rate_percent === undefined
  ) {
    return res.status(400).json({ error: 'All fields (including round_id and interest_rate_percent) are required.' });
  }

  try {
    await poolConnect;

    // Check round status
    const roundResult = await pool.request()
      .input('iki_id', sql.Int, iki_id)
      .input('round_id', sql.Int, round_id)
      .query(`
        SELECT round_status FROM ikimina_rounds 
        WHERE iki_id = @iki_id AND round_id = @round_id
      `);

    if (roundResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Round not found for this ikimina.' });
    }

    const roundStatus = roundResult.recordset[0].round_status;
    if (roundStatus === 'active' || roundStatus === 'completed') {
      return res.status(403).json({ message: `Cannot edit rules for '${roundStatus}' round.` });
    }

    // Check if rules already exist
    const ruleCheck = await pool.request()
      .input('iki_id', sql.Int, iki_id)
      .input('round_id', sql.Int, round_id)
      .query(`
        SELECT rule_id FROM ikimina_saving_rules 
        WHERE iki_id = @iki_id AND round_id = @round_id
      `);

    if (ruleCheck.recordset.length > 0) {
      // Update existing
      await pool.request()
        .input('saving_ratio', sql.Decimal(10, 2), saving_ratio)
        .input('time_delay_penalty', sql.Decimal(10, 2), time_delay_penalty)
        .input('date_delay_penalty', sql.Decimal(10, 2), date_delay_penalty)
        .input('time_limit_minutes', sql.Int, time_limit_minutes)
        .input('interest_rate_percent', sql.Decimal(5, 2), interest_rate_percent)
        .input('iki_id', sql.Int, iki_id)
        .input('round_id', sql.Int, round_id)
        .query(`
          UPDATE ikimina_saving_rules
          SET saving_ratio = @saving_ratio,
              time_delay_penalty = @time_delay_penalty,
              date_delay_penalty = @date_delay_penalty,
              time_limit_minutes = @time_limit_minutes,
              interest_rate_percent = @interest_rate_percent
          WHERE iki_id = @iki_id AND round_id = @round_id
        `);
      return res.status(200).json({ message: 'Saving rules updated successfully.' });
    } else {
      // Insert new
      await pool.request()
        .input('iki_id', sql.Int, iki_id)
        .input('round_id', sql.Int, round_id)
        .input('saving_ratio', sql.Decimal(10, 2), saving_ratio)
        .input('time_delay_penalty', sql.Decimal(10, 2), time_delay_penalty)
        .input('date_delay_penalty', sql.Decimal(10, 2), date_delay_penalty)
        .input('time_limit_minutes', sql.Int, time_limit_minutes)
        .input('interest_rate_percent', sql.Decimal(5, 2), interest_rate_percent)
        .query(`
          INSERT INTO ikimina_saving_rules
          (iki_id, round_id, saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes, interest_rate_percent)
          VALUES (@iki_id, @round_id, @saving_ratio, @time_delay_penalty, @date_delay_penalty, @time_limit_minutes, @interest_rate_percent)
        `);
      return res.status(201).json({ message: 'Saving rules created successfully.' });
    }

  } catch (error) {
    console.error('Error saving rules:', error);
    return res.status(500).json({ error: 'Server error while saving rules.' });
  }
});

// Get penalties for ikimina, filtered by round (all, current, or specific)
router.get('/forikimina/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  const { round_id, mode } = req.query;

  try {
    await poolConnect;
    const request = pool.request();
    request.input('iki_id', sql.Int, iki_id);

    let query = `
      SELECT
        pl.penalty_id,
        pl.save_id,
        pl.member_id,
        mi.member_names,
        pl.iki_id,
        pl.slot_id,
        pl.penalty_type,
        pl.penalty_amount,
        pl.rule_time_limit_minutes,
        pl.actual_saving_time,
        pl.allowed_time_limit,
        pl.saving_date,
        pl.created_at,
        pl.is_paid,
        pl.paid_at,
        ir.round_id,
        ir.round_number,
        ir.round_year,
        ir.round_status
      FROM [ims_db].[dbo].[penalty_logs] pl
      INNER JOIN [ims_db].[dbo].[members_info] mi ON pl.member_id = mi.member_id
      INNER JOIN [ims_db].[dbo].[ikimina_rounds] ir 
        ON pl.iki_id = ir.iki_id
        AND pl.saving_date BETWEEN ir.start_date AND ir.end_date
      WHERE pl.iki_id = @iki_id
    `;

    if (mode === 'current') {
      query += ` AND ir.round_status IN ('active', 'completed')`;
    } else if (round_id) {
      request.input('round_id', sql.Int, round_id);
      query += ` AND ir.round_id = @round_id`;
    }

    query += ` ORDER BY pl.saving_date DESC`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching penalty logs:', err);
    res.status(500).json({ error: 'Failed to load penalty logs' });
  }
});

// Get all rounds for dropdown
router.get('/rounds/forikimina/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  try {
    await poolConnect;
    const request = pool.request();
    request.input('iki_id', sql.Int, iki_id);

    const result = await request.query(`
      SELECT round_id, round_number, round_year, round_status
      FROM [ims_db].[dbo].[ikimina_rounds]
      WHERE iki_id = @iki_id
      ORDER BY round_year, round_number
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching rounds:', err);
    res.status(500).json({ error: 'Failed to load rounds' });
  }
});


router.get('/loans/forikimina/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  const { round_id, mode } = req.query;

  try {
    await poolConnect;
    const request = pool.request();

    request.input('iki_id', sql.Int, iki_id);

    let whereClause = 'WHERE l.iki_id = @iki_id';
    if (mode === 'current') {
      whereClause += " AND ir.round_status IN ('active', 'completed')";
    }
    if (round_id && round_id !== 'all') {
      request.input('round_id', sql.Int, round_id);
      whereClause += ' AND l.round_id = @round_id';
    }

    const query = `
      SELECT
        l.loan_id,
        l.member_id,
        mi.member_names,
        l.iki_id,
        l.requested_amount,
        l.approved_amount,
        l.interest_rate,
        l.total_repayable,
        l.status AS loan_status,
        l.request_date,
        l.approval_date,
        l.disbursed_date,
        l.due_date,
        l.repayment_completed_date,
        l.phone_disbursed_to,
        l.round_id,

        lpd.saving_frequency,
        lpd.saving_times_per_period,
        lpd.total_saving_cycles,
        lpd.completed_saving_cycles,
        lpd.user_savings_made,
        lpd.total_current_saving,
        lpd.ikimina_created_year,
        lpd.coverd_rounds,
        lpd.member_round,
        lpd.recent_loan_payment_status,
        lpd.saving_status,
        lpd.has_guardian,
        lpd.member_Join_Year,

        lb.latest_remaining_balance,
        lb.latest_interest_added,
        lb.latest_interest_applied_date,

        rp.latest_repayment_id,
        rp.latest_amount_paid,
        rp.latest_payment_method,
        rp.latest_phone_used,
        rp.latest_payment_date,
        rp.latest_is_full_payment,
        rp.latest_payment_status,
        rp.latest_timing_status,

        ir.round_number,
        ir.round_year,
        ir.round_status

      FROM [ims_db].[dbo].[loans] l

      INNER JOIN [ims_db].[dbo].[members_info] mi ON l.member_id = mi.member_id
      INNER JOIN [ims_db].[dbo].[ikimina_rounds] ir ON l.round_id = ir.round_id

      LEFT JOIN [ims_db].[dbo].[loan_prediction_data] lpd
        ON l.member_id = lpd.member_id
        AND l.round_id = lpd.round_id

      OUTER APPLY (
        SELECT TOP 1
          lb.remaining_balance AS latest_remaining_balance,
          lb.interest_added AS latest_interest_added,
          lb.interest_applied_date AS latest_interest_applied_date
        FROM [ims_db].[dbo].[loan_balance_history] lb
        WHERE lb.loan_id = l.loan_id
        ORDER BY lb.created_at DESC
      ) lb

      OUTER APPLY (
        SELECT TOP 1
          rp.repayment_id AS latest_repayment_id,
          rp.amount_paid AS latest_amount_paid,
          rp.payment_method AS latest_payment_method,
          rp.phone_used AS latest_phone_used,
          rp.payment_date AS latest_payment_date,
          rp.is_full_payment AS latest_is_full_payment,
          rp.payment_status AS latest_payment_status,
          rp.timing_status AS latest_timing_status
        FROM [ims_db].[dbo].[loan_repayments] rp
        WHERE rp.loan_id = l.loan_id
        ORDER BY rp.created_at DESC
      ) rp

      ${whereClause}
      ORDER BY l.request_date DESC
    `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching loans for ikimina:', err);
    res.status(500).json({ error: 'Failed to load loans' });
  }
});

module.exports = router;
