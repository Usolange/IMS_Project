const express = require('express');
const db = require('../config/db');

const router = express.Router();

// GET all weekly times for logged-in user
router.get('/weekly', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized: user not logged in' });

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
  const userId = req.user?.id;
  const { ikimina_name, weeklytime_days, weeklytime_time, f_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !weeklytime_days || !weeklytime_time || !f_id) {
    return res.status(400).json({
      message: 'Missing required fields: ikimina_name, weeklytime_days, weeklytime_time, f_id.'
    });
  }
  if (!Array.isArray(weeklytime_days) || weeklytime_days.length === 0) {
    return res.status(400).json({ message: 'weeklytime_days must be a non-empty array.' });
  }

  try {
    // Check that f_id belongs to this user
    const [categoryRows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [f_id, userId]
    );
    if (categoryRows.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized.' });
    }

    // Check if ikimina_name already exists for this category
    const [existing] = await db.execute(
      'SELECT * FROM Ik_weekly_time_info WHERE ikimina_name = ? AND f_id = ?',
      [ikimina_name.trim(), f_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists for this frequency category.' });
    }

    // Insert all days
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
    res.status(500).json({ message: 'Internal server error while adding weekly times.' });
  }
});

// PUT: Update a weekly time with ownership and uniqueness check
router.put('/:id', async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { ikimina_name, weeklytime_day, weeklytime_time, f_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !weeklytime_day || !weeklytime_time || !f_id) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    // Verify ownership of frequency category
    const [categoryRows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [f_id, userId]
    );
    if (categoryRows.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Verify the weekly time belongs to this category
    const [weeklyTimeRows] = await db.execute(
      'SELECT * FROM Ik_weekly_time_info WHERE weeklytime_id = ? AND f_id = ?',
      [id, f_id]
    );
    if (weeklyTimeRows.length === 0) {
      return res.status(404).json({ message: 'Weekly time not found or unauthorized' });
    }

    // Check for duplicate ikimina_name for this f_id excluding current record
    const [existing] = await db.execute(
      'SELECT * FROM Ik_weekly_time_info WHERE ikimina_name = ? AND f_id = ? AND weeklytime_id != ?',
      [ikimina_name.trim(), f_id, id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists for this frequency category' });
    }

    // Update record
    await db.execute(
      `UPDATE Ik_weekly_time_info
       SET ikimina_name = ?, weeklytime_day = ?, weeklytime_time = ?, f_id = ?
       WHERE weeklytime_id = ?`,
      [ikimina_name.trim(), weeklytime_day.trim(), weeklytime_time, f_id, id]
    );

    res.status(200).json({ message: 'Weekly time updated successfully.' });
  } catch (error) {
    console.error('Error updating weekly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE: Remove weekly time by ID with ownership check
router.delete('/:id', async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Verify ownership
    const [rows] = await db.execute(
      `SELECT w.weeklytime_id
       FROM Ik_weekly_time_info w
       JOIN frequency_category_info c ON w.f_id = c.f_id
       WHERE w.weeklytime_id = ? AND c.sad_id = ?`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Weekly time not found or unauthorized' });
    }

    await db.execute('DELETE FROM Ik_weekly_time_info WHERE weeklytime_id = ?', [id]);
    res.status(200).json({ message: 'Weekly time deleted successfully.' });
  } catch (error) {
    console.error('Error deleting weekly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
