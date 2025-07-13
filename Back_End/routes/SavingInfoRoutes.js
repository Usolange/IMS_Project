
const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/allSavings', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, m.member_names, i.iki_name
      FROM savings_info s
      JOIN Members_info m ON s.member_id = m.member_id
      JOIN Ikimina_info i ON s.iki_id = i.iki_id
      ORDER BY s.date DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching all savings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/saveMoney', async (req, res) => {
  const { member_id, amount, iki_id, ikiminaSavingDate } = req.body;

  if (!amount || !iki_id || !ikiminaSavingDate || !member_id) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Step 1: Get frequency category
    const [ikimina] = await db.query('SELECT f_id FROM Ikimina_info WHERE iki_id = ?', [iki_id]);
    if (!ikimina.length) return res.status(404).json({ message: 'Ikimina not found' });
    const f_id = ikimina[0].f_id;

    let scheduledTime;
    let query;
    const savingDate = new Date();
    const savingDay = savingDate.toLocaleDateString('en-US', { weekday: 'long' });
    const ikDate = new Date(ikiminaSavingDate);
    const day = ikDate.getDate();

    if (f_id === 1) {
      [query] = await db.query('SELECT dtime_time FROM ik_daily_time_info WHERE ikimina_id = ?', [iki_id]);
    } else if (f_id === 5) {
      [query] = await db.query('SELECT weeklytime_time FROM ik_weekly_time_info WHERE ikimina_id = ? AND weeklytime_day = ?', [iki_id, savingDay]);
    } else if (f_id === 3) {
      [query] = await db.query('SELECT monthlytime_time FROM ik_monthly_time_info WHERE ikimina_id = ? AND monthlytime_date = ?', [iki_id, day]);
    }

    if (!query.length) return res.status(404).json({ message: 'Scheduled saving time not found.' });

    scheduledTime = query[0].dtime_time || query[0].weeklytime_time || query[0].monthlytime_time;
    const expectedSaving = new Date(`${ikiminaSavingDate}T${scheduledTime}`);

    const diffMs = savingDate - expectedSaving;
    const delayMinutes = diffMs / 60000;

    let is_late = 0;
    let penalty_amount = 0;
    if (delayMinutes > 120) {
      is_late = 1;
      penalty_amount = 500; // Sample penalty logic
    }

    await db.query(
      `INSERT INTO savings_info (member_id, iki_id, amount, IkiminaSavingDate, penalty_amount, is_late)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [member_id, iki_id, amount, ikiminaSavingDate, penalty_amount, is_late]
    );

    res.json({ success: true, message: 'Saving recorded successfully.' });
  } catch (err) {
    console.error('Error in saving route:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});


router.get('/getSavingsHistory/:member_id', async (req, res) => {
  const { member_id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT s.*, i.iki_name FROM savings_info s JOIN Ikimina_info i ON s.iki_id = i.iki_id WHERE s.member_id = ? ORDER BY s.date DESC',
      [member_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});


module.exports = router;
