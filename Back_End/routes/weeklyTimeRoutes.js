const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Protect all routes with auth middleware
router.use(authenticateToken);

// GET all weekly times for logged-in user
router.get('/weekly', async (req, res) => {
  const userId = req.user?.id; // Get user ID from token

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: user not logged in' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT w.*
       FROM Ik_weekly_time_info w
       JOIN frequency_category_info c ON w.f_id = c.f_id
       WHERE c.sad_id = ?`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching weekly times:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST: Add new weekly times (multiple days)
router.post('/', async (req, res) => {
  const { ikimina_name, weeklytime_days, weeklytime_time, f_id } = req.body;

  if (!weeklytime_days || !weeklytime_time || !f_id || !ikimina_name) {
    return res.status(400).json({
      message: 'Missing required fields: weeklytime_days, weeklytime_time, f_id, ikimina_name.'
    });
  }

  if (!Array.isArray(weeklytime_days) || weeklytime_days.length === 0) {
    return res.status(400).json({
      message: 'weeklytime_days must be a non-empty array.'
    });
  }

  try {
    const insertPromises = weeklytime_days.map(day =>
      db.execute(
        `INSERT INTO Ik_weekly_time_info (ikimina_name, weeklytime_day, weeklytime_time, f_id)
         VALUES (?, ?, ?, ?)`,
        [ikimina_name.trim(), day.trim(), weeklytime_time, f_id]
      )
    );

    await Promise.all(insertPromises);

    res.status(201).json({
      message: 'Weekly times added successfully.',
      added: weeklytime_days.map(day => day.trim())
    });
  } catch (error) {
    console.error('Error adding weekly times:', error.message);
    res.status(500).json({
      message: 'Internal server error while adding weekly times.'
    });
  }
});

// PUT: Update a weekly time
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { ikimina_name, weeklytime_day, weeklytime_time, f_id } = req.body;

  if (!weeklytime_day || !weeklytime_time || !f_id) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    await db.execute(
      `UPDATE Ik_weekly_time_info
       SET ikimina_name = ?, weeklytime_day = ?, weeklytime_time = ?, f_id = ?
       WHERE weeklytime_id = ?`,
      [ikimina_name, weeklytime_day, weeklytime_time, f_id, id]
    );

    res.status(200).json({ message: 'Weekly time updated successfully.' });
  } catch (error) {
    console.error('Error updating weekly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE: Remove weekly time by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM Ik_weekly_time_info WHERE weeklytime_id = ?', [id]);
    res.status(200).json({ message: 'Weekly time deleted successfully.' });
  } catch (error) {
    console.error('Error deleting weekly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
