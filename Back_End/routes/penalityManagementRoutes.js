const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware: Ikimina user authentication via header
const authenticateIkimina = (req, res, next) => {
  const iki_id = req.header('x-iki-id');
  if (!iki_id) {
    return res.status(401).json({ success: false, message: 'Unauthorized: iki_id missing' });
  }
  req.iki_id = iki_id;
  next();
};

// 👉 GET Ikimina penalties
router.get('/myInfo', authenticateIkimina, async (req, res) => {
  const iki_id = req.iki_id;

  try {
    const [rows] = await db.query(`
      SELECT saving_period_gap, penalty_date_delay, penalty_time_delay 
      FROM Ikimina_info 
      WHERE iki_id = ?
    `, [iki_id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ikimina not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching penalties:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 👉 PUT update penalties
router.put('/myPenalties', authenticateIkimina, async (req, res) => {
  const iki_id = req.iki_id;
  const { saving_period_gap, penalty_date_delay, penalty_time_delay } = req.body;

  if (
    typeof saving_period_gap === 'undefined' ||
    typeof penalty_date_delay === 'undefined' ||
    typeof penalty_time_delay === 'undefined'
  ) {
    return res.status(400).json({ success: false, message: 'All penalty fields are required.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT iki_id FROM Ikimina_info WHERE iki_id = ?`,
      [iki_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ikimina not found' });
    }

    await db.query(
      `UPDATE Ikimina_info SET 
        saving_period_gap = ?, 
        penalty_date_delay = ?, 
        penalty_time_delay = ?
      WHERE iki_id = ?`,
      [saving_period_gap, penalty_date_delay, penalty_time_delay, iki_id]
    );

    res.json({ success: true, message: 'Your penalties updated successfully' });
  } catch (err) {
    console.error('Error updating penalties:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 👉 GET time schedule based on frequency (auto-detect)
router.get('/schedule/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  try {
    // Get frequency and name
    const [ikiminaRow] = await db.query(`
      SELECT i.f_id, i.iki_name
      FROM Ikimina_info i
      WHERE i.iki_id = ?
    `, [iki_id]);

    if (ikiminaRow.length === 0) {
      return res.status(404).json({ success: false, message: 'Ikimina not found' });
    }

    const { f_id, iki_name } = ikiminaRow[0];
    let schedule = [];
    let frequency = '';

    if (f_id === 1) {
      frequency = 'daily';
      const [rows] = await db.query(`
        SELECT dtime_id AS id, dtime_time AS time 
        FROM ik_daily_time_info 
        WHERE ikimina_id = ?
      `, [iki_id]);
      schedule = rows;
    } else if (f_id === 2) {
      frequency = 'weekly';
      const [rows] = await db.query(`
        SELECT weeklytime_id AS id, weeklytime_day AS day, weeklytime_time AS time 
        FROM ik_weekly_time_info 
        WHERE ikimina_id = ?
      `, [iki_id]);
      schedule = rows;
    } else if (f_id === 3) {
      frequency = 'monthly';
      const [rows] = await db.query(`
        SELECT monthlytime_id AS id, monthlytime_date AS date, monthlytime_time AS time 
        FROM ik_monthly_time_info 
        WHERE ikimina_id = ?
      `, [iki_id]);
      schedule = rows;
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported frequency type' });
    }

    return res.json({
      success: true,
      ikimina: iki_name,
      frequency,
      schedule
    });

  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
