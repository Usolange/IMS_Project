const express = require('express');
const db = require('../config/db');

const router = express.Router();

// GET all daily times created by the logged-in user (based on sad_id in category)
router.get('/daily', async (req, res) => {
  const userId = req.user?.id; // or get from header/localStorage as per your auth

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: user not logged in' });
  }

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

// POST: Add new daily time with uniqueness check
router.post('/', async (req, res) => {
  const userId = req.user?.id;
  const { ikimina_name, dtime_time, f_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !dtime_time || !f_id) {
    return res.status(400).json({ message: 'Missing ikimina_name, dtime_time or f_id' });
  }

  try {
    // Verify the frequency category belongs to the logged-in user
    const [categoryRows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [f_id, userId]
    );
    if (categoryRows.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Check if ikimina_name already exists for the same f_id
    const [existing] = await db.execute(
      'SELECT * FROM ik_daily_time_info WHERE ikimina_name = ? AND f_id = ?',
      [ikimina_name, f_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists for this frequency category' });
    }

    // Insert new daily time
    await db.execute(
      'INSERT INTO ik_daily_time_info (ikimina_name, dtime_time, f_id) VALUES (?, ?, ?)',
      [ikimina_name, dtime_time, f_id]
    );
    res.status(201).json({ message: 'Daily time saved successfully.' });
  } catch (error) {
    console.error('Error saving daily time:', error.message);
    res.status(500).json({ message: 'Failed to save daily time.' });
  }
});

// PUT: Update a daily time with ownership and uniqueness checks
router.put('/:id', async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { ikimina_name, dtime_time, f_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!dtime_time || !f_id) {
    return res.status(400).json({ message: 'Missing dtime_time or f_id' });
  }

  try {
    // Verify the frequency category belongs to the logged-in user
    const [categoryRows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [f_id, userId]
    );
    if (categoryRows.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Verify the daily time to update belongs to this category
    const [dailyTimeRows] = await db.execute(
      'SELECT * FROM ik_daily_time_info WHERE dtime_id = ? AND f_id = ?',
      [id, f_id]
    );
    if (dailyTimeRows.length === 0) {
      return res.status(404).json({ message: 'Daily time not found or unauthorized' });
    }

    // Check for duplicate ikimina_name for this f_id excluding current record
    if (ikimina_name) {
      const [existing] = await db.execute(
        'SELECT * FROM ik_daily_time_info WHERE ikimina_name = ? AND f_id = ? AND dtime_id != ?',
        [ikimina_name, f_id, id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: 'Ikimina name already exists for this frequency category' });
      }
    }

    // Update record
    await db.execute(
      'UPDATE ik_daily_time_info SET ikimina_name = ?, dtime_time = ?, f_id = ? WHERE dtime_id = ?',
      [ikimina_name, dtime_time, f_id, id]
    );
    res.status(200).json({ message: 'Daily time updated successfully.' });
  } catch (error) {
    console.error('Error updating daily time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE: Remove a daily time with ownership check
router.delete('/:id', async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Verify the daily time exists and belongs to a frequency category owned by user
    const [rows] = await db.execute(
      `SELECT d.dtime_id
       FROM ik_daily_time_info d
       JOIN frequency_category_info c ON d.f_id = c.f_id
       WHERE d.dtime_id = ? AND c.sad_id = ?`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Daily time not found or unauthorized' });
    }

    await db.execute('DELETE FROM ik_daily_time_info WHERE dtime_id = ?', [id]);
    res.status(200).json({ message: 'Daily time deleted successfully.' });
  } catch (error) {
    console.error('Error deleting daily time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
