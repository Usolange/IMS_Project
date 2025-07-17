const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');

async function runQuery(query, params = []) {
  await poolConnect;
  const request = pool.request();
  params.forEach(({ name, type, value }) => request.input(name, type, value));
  const result = await request.query(query);
  return result.recordset;
}

// GET /ikiminaInfo/:iki_id
router.get('/ikiminaInfo/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    const rows = await runQuery(
      'SELECT iki_name FROM ikimina_info WHERE iki_id = @iki_id',
      [{ name: 'iki_id', type: sql.Int, value: iki_id }]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching ikimina info:', err);
    res.status(500).json({ message: 'Failed to fetch Ikimina name' });
  }
});

// GET existing rules for a group
router.get('/selectRules/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    const rows = await runQuery(
      `SELECT saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes
       FROM ikimina_saving_rules WHERE iki_id = @iki_id`,
      [{ name: 'iki_id', type: sql.Int, value: iki_id }]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No rules set yet.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /rules error:', err);
    res.status(500).json({ message: 'Failed to fetch rules' });
  }
});

// PUT to update or insert rules
router.put('/newRules/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  const { saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes } = req.body;

  if (
    saving_ratio === undefined ||
    time_delay_penalty === undefined ||
    date_delay_penalty === undefined ||
    time_limit_minutes === undefined
  ) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const cycleStatusRows = await runQuery(
      `SELECT TOP 1 is_cycle_active FROM saving_cycles WHERE iki_id = @iki_id ORDER BY cycle_start DESC`,
      [{ name: 'iki_id', type: sql.Int, value: iki_id }]
    );

    if (cycleStatusRows.length > 0 && cycleStatusRows[0].is_cycle_active) {
      return res.status(403).json({
        message: 'Saving cycle is active. Rules cannot be changed now.',
      });
    }

    const existing = await runQuery(
      `SELECT * FROM ikimina_saving_rules WHERE iki_id = @iki_id`,
      [{ name: 'iki_id', type: sql.Int, value: iki_id }]
    );

    if (existing.length > 0) {
      await runQuery(
        `UPDATE ikimina_saving_rules SET saving_ratio = @saving_ratio, time_delay_penalty = @time_delay_penalty, date_delay_penalty = @date_delay_penalty, time_limit_minutes = @time_limit_minutes WHERE iki_id = @iki_id`,
        [
          { name: 'saving_ratio', type: sql.Int, value: saving_ratio },
          { name: 'time_delay_penalty', type: sql.Decimal(18, 2), value: time_delay_penalty },
          { name: 'date_delay_penalty', type: sql.Decimal(18, 2), value: date_delay_penalty },
          { name: 'time_limit_minutes', type: sql.Int, value: time_limit_minutes },
          { name: 'iki_id', type: sql.Int, value: iki_id },
        ]
      );
    } else {
      await runQuery(
        `INSERT INTO ikimina_saving_rules (iki_id, saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes)
         VALUES (@iki_id, @saving_ratio, @time_delay_penalty, @date_delay_penalty, @time_limit_minutes)`,
        [
          { name: 'iki_id', type: sql.Int, value: iki_id },
          { name: 'saving_ratio', type: sql.Int, value: saving_ratio },
          { name: 'time_delay_penalty', type: sql.Decimal(18, 2), value: time_delay_penalty },
          { name: 'date_delay_penalty', type: sql.Decimal(18, 2), value: date_delay_penalty },
          { name: 'time_limit_minutes', type: sql.Int, value: time_limit_minutes },
        ]
      );
    }

    res.json({ message: 'Rules saved successfully' });
  } catch (err) {
    console.error('PUT /rules error:', err);
    res.status(500).json({ message: 'Failed to save rules' });
  }
});

module.exports = router;
