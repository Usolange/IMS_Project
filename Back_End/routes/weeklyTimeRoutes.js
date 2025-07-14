const express = require('express');
const db = require('../config/db');

const router = express.Router();

/**
 * GET all weekly times created by the logged-in user
 */
router.get('/weekly', async (req, res) => {
  const userId = req.query.sad_id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: user ID missing' });
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

router.post('/newSchedule', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { ikimina_name, selected_days, wtime_time, f_id, location_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !selected_days || !wtime_time || !f_id || !location_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (!Array.isArray(selected_days) || selected_days.length === 0) {
    return res.status(400).json({ message: 'selected_days must be a non-empty array' });
  }

  try {
    // Verify category ownership
    const [categoryRows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [f_id, userId]
    );
    if (categoryRows.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Check existing schedules for this location_id
    const [daily] = await db.execute('SELECT 1 FROM ik_daily_time_info WHERE location_id = ?', [location_id]);
    const [weekly] = await db.execute('SELECT 1 FROM ik_weekly_time_info WHERE location_id = ?', [location_id]);
    const [monthly] = await db.execute('SELECT 1 FROM ik_monthly_time_info WHERE location_id = ?', [location_id]);

    if (daily.length > 0 || weekly.length > 0 || monthly.length > 0) {
      return res.status(409).json({ message: 'This Ikimina already has a schedule.' });
    }

    // Check if ikimina_name already exists in weekly schedules for this category
    const [existing] = await db.execute(
      'SELECT * FROM ik_weekly_time_info WHERE ikimina_name = ? AND f_id = ?',
      [ikimina_name.trim(), f_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists for this frequency category.' });
    }

    // Insert weekly schedule for each selected day
    const insertPromises = selected_days.map(day =>
      db.execute(
        `INSERT INTO ik_weekly_time_info (ikimina_name, weeklytime_day, weeklytime_time, f_id, location_id)
         VALUES (?, ?, ?, ?, ?)`,
        [ikimina_name.trim(), day.trim(), wtime_time, f_id, location_id]
      )
    );
    await Promise.all(insertPromises);

    res.status(201).json({ message: 'Weekly schedule saved successfully.' });
  } catch (error) {
    console.error('Error saving weekly schedule:', error.message);
    res.status(500).json({ message: 'Internal server error while saving weekly schedule.' });
  }
});

router.put('/:id', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { id } = req.params;
  const { ikimina_name, weeklytime_day, weeklytime_time, f_id, location_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !weeklytime_day || !weeklytime_time || !f_id || !location_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Confirm ownership of frequency category
    const [categoryRows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [f_id, userId]
    );
    if (categoryRows.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Confirm record exists and belongs to category
    const [weeklyTimeRows] = await db.execute(
      'SELECT * FROM Ik_weekly_time_info WHERE weeklytime_id = ? AND f_id = ?',
      [id, f_id]
    );
    if (weeklyTimeRows.length === 0) {
      return res.status(404).json({ message: 'Weekly time not found or unauthorized' });
    }

    // Prevent duplicate ikimina_name in this category (excluding current record)
    const [duplicateName] = await db.execute(
      'SELECT * FROM Ik_weekly_time_info WHERE ikimina_name = ? AND f_id = ? AND weeklytime_id != ?',
      [ikimina_name.trim(), f_id, id]
    );
    if (duplicateName.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already used in this frequency category' });
    }

    // Validate location_id uniqueness across all schedules except current record
    const [daily] = await db.execute(
      'SELECT 1 FROM ik_daily_time_info WHERE location_id = ?',
      [location_id]
    );
    const [weekly] = await db.execute(
      'SELECT 1 FROM Ik_weekly_time_info WHERE location_id = ? AND weeklytime_id != ?',
      [location_id, id]
    );
    const [monthly] = await db.execute(
      'SELECT 1 FROM Ik_monthly_time_info WHERE location_id = ?',
      [location_id]
    );

    if (daily.length > 0 || weekly.length > 0 || monthly.length > 0) {
      return res.status(409).json({
        message: 'This Ikimina already has a schedule in daily, weekly, or monthly.',
      });
    }

    // Update record
    await db.execute(
      `UPDATE Ik_weekly_time_info
       SET ikimina_name = ?, weeklytime_day = ?, weeklytime_time = ?, f_id = ?, location_id = ?
       WHERE weeklytime_id = ?`,
      [ikimina_name.trim(), weeklytime_day.trim(), weeklytime_time, f_id, location_id, id]
    );

    res.status(200).json({ message: 'Weekly time updated successfully.' });
  } catch (error) {
    console.error('Error updating weekly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * DELETE a weekly time record with ownership check
 */
router.delete('/:id', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { id } = req.params;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
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
