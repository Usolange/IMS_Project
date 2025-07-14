const express = require('express');
const router = express.Router();
const db = require('../config/db');


// GET /ikiminaInfo/:iki_id
router.get('/ikiminaInfo/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    const [rows] = await db.query('SELECT iki_name FROM ikimina_info WHERE iki_id = ?', [iki_id]);
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
    const [rows] = await db.query(
      `SELECT saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes
       FROM ikimina_saving_rules WHERE iki_id = ?`,
      [iki_id]
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
  const {
    saving_ratio,
    time_delay_penalty,
    date_delay_penalty,
    time_limit_minutes,
  } = req.body;

  if (
    saving_ratio === undefined ||
    time_delay_penalty === undefined ||
    date_delay_penalty === undefined ||
    time_limit_minutes === undefined
  ) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Check if saving cycle is active
    // Assuming you have a 'saving_cycles' table or a flag in rules table
    const [cycleStatusRows] = await db.query(
      'SELECT is_cycle_active FROM saving_cycles WHERE iki_id = ? ORDER BY cycle_start DESC LIMIT 1',
      [iki_id]
    );

    if (cycleStatusRows.length > 0 && cycleStatusRows[0].is_cycle_active) {
      return res.status(403).json({
        message: 'Saving cycle is active. Rules cannot be changed now.',
      });
    }

    const [existing] = await db.query(
      'SELECT * FROM ikimina_saving_rules WHERE iki_id = ?',
      [iki_id]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE ikimina_saving_rules SET saving_ratio = ?, time_delay_penalty = ?, date_delay_penalty = ?, time_limit_minutes = ? WHERE iki_id = ?`,
        [saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes, iki_id]
      );
    } else {
      await db.query(
        `INSERT INTO ikimina_saving_rules (iki_id, saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes)
         VALUES (?, ?, ?, ?, ?)`,
        [iki_id, saving_ratio, time_delay_penalty, date_delay_penalty, time_limit_minutes]
      );
    }

    res.json({ message: 'Rules saved successfully' });
  } catch (err) {
    console.error('PUT /rules error:', err);
    res.status(500).json({ message: 'Failed to save rules' });
  }
});


module.exports = router;
