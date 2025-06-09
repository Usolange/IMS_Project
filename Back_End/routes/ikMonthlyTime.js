const express = require('express');
const db = require('../config/db');
const router = express.Router();

// POST: Add monthly times
router.post('/', async (req, res) => {
  try {
    const { ikimina_name, monthlytime_dates, monthlytime_time, f_id } = req.body;

    if (!ikimina_name || !monthlytime_dates || !monthlytime_time || !f_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!Array.isArray(monthlytime_dates) || monthlytime_dates.some(d => d < 1 || d > 31)) {
      return res.status(400).json({ message: 'Days must be between 1 and 31' });
    }

    const datesString = monthlytime_dates.join(',');

    await db.execute(
      `INSERT INTO ikimina_monthly_time 
      (ikimina_name, monthlytime_date, monthlytime_time, f_id)
      VALUES (?, ?, ?, ?)`,
      [ikimina_name, datesString, monthlytime_time, f_id]
    );

    res.status(201).json({ message: 'Monthly time added successfully!' });
  } catch (error) {
    console.error('🔥 Error saving monthly time:', error.message);
    res.status(500).json({ message: 'Internal server error while adding monthly time.' });
  }
});

// GET: Retrieve all monthly times
router.get('/select', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Ik_monthly_time_info');

    const result = rows.map(row => ({
      ...row,
      monthlytime_dates: row.monthlytime_date.split(',').map(date => date.trim())
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching monthly times:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
