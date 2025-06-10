const express = require('express');
const db = require('../config/db');

const router = express.Router();

// GET all daily times created by the logged-in user (based on sad_id in category)
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT d.*
       FROM ik_daily_time_info d
       JOIN frequency_category_info c ON d.f_id = c.f_id
       WHERE c.sad_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching daily times:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST: Add new daily time
router.post('/', async (req, res) => {
  const { ikimina_name, dtime_time, f_id } = req.body;

  if (!dtime_time || !f_id) {
    return res.status(400).json({ message: 'Missing dtime_time or f_id' });
  }

  try {
    await db.execute(
      `INSERT INTO ik_daily_time_info (ikimina_name, dtime_time, f_id)
       VALUES (?, ?, ?)`,
      [ikimina_name, dtime_time, f_id]
    );
    res.status(201).json({ message: 'Daily time saved successfully.' });
  } catch (error) {
    console.error('Error saving daily time:', error.message);
    res.status(500).json({ message: 'Failed to save daily time.' });
  }
});

// PUT: Update a daily time
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { ikimina_name, dtime_time, f_id } = req.body;

  if (!dtime_time || !f_id) {
    return res.status(400).json({ message: 'Missing dtime_time or f_id' });
  }

  try {
    await db.execute(
      `UPDATE ik_daily_time_info
       SET ikimina_name = ?, dtime_time = ?, f_id = ?
       WHERE dtime_id = ?`,
      [ikimina_name, dtime_time, f_id, id]
    );
    res.status(200).json({ message: 'Daily time updated successfully.' });
  } catch (error) {
    console.error('Error updating daily time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE: Remove a daily time
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM ik_daily_time_info WHERE dtime_id = ?', [id]);
    res.status(200).json({ message: 'Daily time deleted successfully.' });
  } catch (error) {
    console.error('Error deleting daily time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
