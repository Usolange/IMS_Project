const express = require('express');
const db = require('../config/db'); // You use `db`, but inside POST you use `pool`. Use `db` consistently.

const router = express.Router();

// Get all daily times
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM ik_daily_time_info');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching daily times:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add a new daily time
router.post('/', async (req, res) => {
  try {
    const { ikimina_name, dtime_time, f_id } = req.body;

    if (!dtime_time || !f_id) {
      return res.status(400).json({ message: 'Missing dtime_time or f_id' });
    }

    const [result] = await db.execute(
      'INSERT INTO ik_daily_time_info (ikimina_name, dtime_time, f_id) VALUES (?, ?, ?)',
      [ikimina_name, dtime_time, f_id]
    );

    res.status(201).json({ message: 'Daily time saved', id: result.insertId });
  } catch (error) {
    console.error('Error adding daily time:', error);
    res.status(500).json({ message: 'Failed to save daily time' });
  }
});

// Update a daily time
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { ikimina_name, dtime_time, f_id } = req.body;

  if (!dtime_time || !f_id) {
    return res.status(400).json({ message: 'Missing dtime_time or f_id' });
  }

  try {
    await db.execute(
      'UPDATE ik_daily_time_info SET ikimina_name = ?, dtime_time = ?, f_id = ? WHERE dtime_id = ?',
      [ikimina_name, dtime_time, f_id, id]
    );
    res.status(200).json({ message: 'Daily time updated', id, ikimina_name, dtime_time, f_id });
  } catch (error) {
    console.error('Error updating daily time:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a daily time
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM ik_daily_time_info WHERE dtime_id = ?', [id]);
    res.status(200).json({ message: 'Daily time deleted successfully' });
  } catch (error) {
    console.error('Error deleting daily time:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
