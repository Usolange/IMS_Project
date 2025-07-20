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

router.get('/ikiminaInfo/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  if (!iki_id) {
    return res.status(400).json({ message: 'Ikimina ID is required' });
  }

  try {
    const query = `
      SELECT iki_id, iki_name, iki_email, iki_username, location_id, f_id
      FROM ikimina_info
      WHERE iki_id = @iki_id
    `;

    const result = await runQuery(query, [
      { name: 'iki_id', type: sql.Int, value: parseInt(iki_id, 10) }
    ]);

    if (!result.length) {
      return res.status(404).json({ message: 'Ikimina not found' });
    }

    res.json(result[0]);
  } catch (err) {
    console.error('[ikiminaInfo] Error fetching ikimina:', err);
    res.status(500).json({ message: 'Server error fetching Ikimina info' });
  }
});

router.get('/getRulesForSelectedRound/:iki_id/:round_id', async (req, res) => {
  const { iki_id, round_id } = req.params;

  try {
    const result = await pool
      .request()
      .input('iki_id', sql.Int, iki_id)
      .input('round_id', sql.Int, round_id)
      .query(`
        SELECT saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes
        FROM ikimina_saving_rules
        WHERE iki_id = @iki_id AND round_id = @round_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'No rules found for this round.' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Server error while fetching rules.' });
  }
});
// activeRound route
router.get('/activeRound/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  if (!iki_id) {
    console.warn('[selectRules] ❌ Missing iki_id in params');
    return res.status(400).json({ message: 'Ikimina ID is required.' });
  }

  console.log(`[selectRules] 🔍 Received iki_id: ${iki_id}`);

  try {
    const roundQuery = `
      SELECT TOP 1 round_id, round_year, start_date, end_date
      FROM ikimina_rounds 
      WHERE iki_id = @iki_id AND round_status = 'active' 
      ORDER BY round_id DESC`;

    const roundRows = await runQuery(roundQuery, [
      { name: 'iki_id', type: sql.Int, value: parseInt(iki_id, 10) }
    ]);

    if (!roundRows.length) {
      console.log('[selectRules] ℹ️ No active round found for iki_id:', iki_id);
      return res.status(404).json({ message: 'No active round found for this Ikimina.' });
    }

    const round = roundRows[0];
    console.log('[selectRules] ✅ Active Round Found:', round);

    const rulesQuery = `
      SELECT saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes
      FROM ikimina_saving_rules
      WHERE iki_id = @iki_id AND round_id = @round_id`;

    const rules = await runQuery(rulesQuery, [
      { name: 'iki_id', type: sql.Int, value: parseInt(iki_id, 10) },
      { name: 'round_id', type: sql.Int, value: round.round_id }
    ]);

    if (!rules.length) {
      console.log(`[selectRules] ⚠️ No saving rules found for round_id: ${round.round_id}`);
      return res.status(404).json({ message: 'No saving rules set for the current active round.' });
    }

    console.log('[selectRules] ✅ Saving Rules Found:', rules[0]);

    const responsePayload = {
      round,
      rules: rules[0]
    };

    console.log('[selectRules] 🚀 Sending Response:', responsePayload);
    res.json(responsePayload);

  } catch (error) {
    console.error('[selectRules] ❌ Error fetching rules:', error);
    res.status(500).json({ message: 'Internal server error while fetching saving rules.' });
  }
});
// completedRounds route
router.get('/completedRounds/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  if (!iki_id) {
    console.warn('[completedRounds] Missing iki_id in params');
    return res.status(400).json({ message: 'Ikimina ID is required.' });
  }

  try {
    const roundsQuery = `
      SELECT round_id, round_year, start_date, end_date
      FROM ikimina_rounds
      WHERE iki_id = @iki_id AND round_status = 'completed'
      ORDER BY end_date DESC`;

    const rounds = await runQuery(roundsQuery, [
      { name: 'iki_id', type: sql.Int, value: parseInt(iki_id, 10) }
    ]);

    if (!rounds.length) {
      return res.status(404).json({ message: 'No completed rounds found for this Ikimina.' });
    }

    res.json(rounds);
  } catch (error) {
    console.error('[completedRounds] Error fetching completed rounds:', error);
    res.status(500).json({ message: 'Internal server error while fetching completed rounds.' });
  }
});
// upcomingRounds route
router.get('/upcomingRounds/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  if (!iki_id) {
    console.warn('[upcomingRounds] Missing iki_id in params');
    return res.status(400).json({ message: 'Ikimina ID is required.' });
  }

  try {
    const roundsQuery = `
      SELECT round_id, round_year, start_date, end_date
      FROM ikimina_rounds
      WHERE iki_id = @iki_id AND round_status = 'upcoming'
      ORDER BY start_date ASC`;

    const rounds = await runQuery(roundsQuery, [
      { name: 'iki_id', type: sql.Int, value: parseInt(iki_id, 10) }
    ]);

    if (!rounds.length) {
      return res.status(404).json({ message: 'No upcoming rounds found for this Ikimina.' });
    }

    res.json(rounds);
  } catch (error) {
    console.error('[upcomingRounds] Error fetching upcoming rounds:', error);
    res.status(500).json({ message: 'Internal server error while fetching upcoming rounds.' });
  }
});

// newRules  route
router.put('/newRules/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  const {
    round_id,
    saving_ratio,
    time_delay_penalty,
    date_delay_penalty,
    time_limit_minutes,
  } = req.body;

  if (
    !round_id ||
    saving_ratio === undefined ||
    time_delay_penalty === undefined ||
    date_delay_penalty === undefined ||
    time_limit_minutes === undefined
  ) {
    return res.status(400).json({ error: 'All fields (including round_id) are required.' });
  }

  try {
    await poolConnect; // ensures pool is ready

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

    const roundStatus = roundResult.recordset[0].status;
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
        .input('iki_id', sql.Int, iki_id)
        .input('round_id', sql.Int, round_id)
        .query(`
          UPDATE ikimina_saving_rules
          SET saving_ratio = @saving_ratio,
              time_delay_penalty = @time_delay_penalty,
              date_delay_penalty = @date_delay_penalty,
              time_limit_minutes = @time_limit_minutes
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
        .query(`
          INSERT INTO ikimina_saving_rules
          (iki_id, round_id, saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes)
          VALUES (@iki_id, @round_id, @saving_ratio, @time_delay_penalty, @date_delay_penalty, @time_limit_minutes)
        `);
      return res.status(201).json({ message: 'Saving rules created successfully.' });
    }

  } catch (error) {
    console.error('Error saving rules:', error);
    return res.status(500).json({ error: 'Server error while saving rules.' });
  }
});

module.exports = router;
