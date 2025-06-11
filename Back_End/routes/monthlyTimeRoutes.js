const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Protect all routes with auth middleware
router.use(authenticateToken);

// GET all monthly times for logged-in user
router.get('/monthly', async (req, res) => {
  const userId = req.user?.id; // get user ID from token

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: user not logged in' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT m.*
       FROM Ik_monthly_time_info m
       JOIN frequency_category_info c ON m.f_id = c.f_id
       WHERE c.sad_id = ?`,
      [userId]
    );

    // Convert monthlytime_date string back to array of dates
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

// POST: Add new monthly times (multiple dates)
router.post('/', async (req, res) => {
  try {
    const { ikimina_name, monthlytime_dates, monthlytime_time, f_id } = req.body;

    if (!ikimina_name || !monthlytime_dates || !monthlytime_time || !f_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (
      !Array.isArray(monthlytime_dates) ||
      monthlytime_dates.some(d => d < 1 || d > 31)
    ) {
      return res.status(400).json({ message: 'Days must be between 1 and 31' });
    }

    const datesString = monthlytime_dates.join(',');

    await db.execute(
      `INSERT INTO Ik_monthly_time_info 
       (ikimina_name, monthlytime_date, monthlytime_time, f_id)
       VALUES (?, ?, ?, ?)`,
      [ikimina_name, datesString, monthlytime_time, f_id]
    );

    res.status(201).json({ message: 'Monthly time added successfully!' });
  } catch (error) {
    console.error('Error saving monthly time:', error.message);
    res.status(500).json({ message: 'Internal server error while adding monthly time.' });
  }
});

// PUT: Update a monthly time
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { ikimina_name, monthlytime_dates, monthlytime_time, f_id } = req.body;

  if (
    !ikimina_name ||
    !monthlytime_dates ||
    !monthlytime_time ||
    !f_id ||
    !Array.isArray(monthlytime_dates) ||
    monthlytime_dates.some(d => d < 1 || d > 31)
  ) {
    return res.status(400).json({ message: 'Missing or invalid required fields' });
  }

  try {
    const datesString = monthlytime_dates.join(',');

    await db.execute(
      `UPDATE Ik_monthly_time_info
       SET ikimina_name = ?, monthlytime_date = ?, monthlytime_time = ?, f_id = ?
       WHERE monthlytime_id = ?`,
      [ikimina_name, datesString, monthlytime_time, f_id, id]
    );

    res.status(200).json({ message: 'Monthly time updated successfully.' });
  } catch (error) {
    console.error('Error updating monthly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE: Remove monthly time by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM Ik_monthly_time_info WHERE monthlytime_id = ?', [id]);
    res.status(200).json({ message: 'Monthly time deleted successfully.' });
  } catch (error) {
    console.error('Error deleting monthly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
