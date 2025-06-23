const express = require('express');
const db = require('../config/db');

const router = express.Router();

/**
 * GET all monthly times created by the logged-in user
 */
router.post('/newSchedule', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { ikimina_id, ikimina_name, selected_dates, mtime_time, f_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_id || !ikimina_name || !Array.isArray(selected_dates) || selected_dates.length === 0 || !mtime_time || !f_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Verify user owns the frequency category
    const [freqCatRows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [f_id, userId]
    );
    if (freqCatRows.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Check if this ikimina already has any schedule in daily, weekly or monthly tables
    const [dailyRows] = await db.execute('SELECT 1 FROM ik_daily_time_info WHERE ikimina_id = ?', [ikimina_id]);
    const [weeklyRows] = await db.execute('SELECT 1 FROM ik_weekly_time_info WHERE ikimina_id = ?', [ikimina_id]);
    const [monthlyRows] = await db.execute('SELECT 1 FROM ik_monthly_time_info WHERE ikimina_id = ?', [ikimina_id]);

    if (dailyRows.length > 0 || weeklyRows.length > 0 || monthlyRows.length > 0) {
      return res.status(409).json({ message: 'This Ikimina already has a schedule.' });
    }

    // Check if ikimina_name already exists for this category in monthly schedules
    const [existingName] = await db.execute(
      'SELECT 1 FROM ik_monthly_time_info WHERE ikimina_name = ? AND f_id = ?',
      [ikimina_name.trim(), f_id]
    );
    if (existingName.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists for this frequency category.' });
    }

    // Insert one row per selected date
    const insertPromises = selected_dates.map(date =>
      db.execute(
        `INSERT INTO ik_monthly_time_info (ikimina_name, monthlytime_date, monthlytime_time, f_id, ikimina_id)
         VALUES (?, ?, ?, ?, ?)`,
        [ikimina_name.trim(), date.trim(), mtime_time, f_id, ikimina_id]
      )
    );
    await Promise.all(insertPromises);

    res.status(201).json({ message: 'Monthly schedule saved successfully.' });
  } catch (error) {
    console.error('Error saving monthly schedule:', error.message);
    res.status(500).json({ message: 'Internal server error while saving monthly schedule.' });
  }
});


/**
 * POST: Create new monthly schedule
 * - Checks ownership by sad_id
 * - Prevents duplicate ikimina_name for the same frequency category
 * - Validates ikimina_id uniqueness across all schedule tables (daily, weekly, monthly)
 */
router.post('/newSchedule', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { ikimina_name, monthlytime_day, monthlytime_time, f_id, ikimina_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !monthlytime_day || !monthlytime_time || !f_id || !ikimina_id) {
    return res.status(400).json({ message: 'Missing required fields: ikimina_name, monthlytime_day, monthlytime_time, f_id, or ikimina_id' });
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

    // Check if this ikimina_id already exists in daily, weekly, or monthly
    const [daily] = await db.execute('SELECT 1 FROM ik_daily_time_info WHERE ikimina_id = ?', [ikimina_id]);
    const [weekly] = await db.execute('SELECT 1 FROM Ik_weekly_time_info WHERE ikimina_id = ?', [ikimina_id]);
    const [monthly] = await db.execute('SELECT 1 FROM Ik_monthly_time_info WHERE ikimina_id = ?', [ikimina_id]);

    if (daily.length > 0 || weekly.length > 0 || monthly.length > 0) {
      return res.status(409).json({
        message: 'This Ikimina already has a schedule in daily, weekly, or monthly.',
      });
    }

    // Check if ikimina_name already exists in monthly for this category
    const [existing] = await db.execute(
      'SELECT * FROM Ik_monthly_time_info WHERE ikimina_name = ? AND f_id = ?',
      [ikimina_name.trim(), f_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists for this frequency category.' });
    }

    // Insert monthly schedule
    await db.execute(
      `INSERT INTO Ik_monthly_time_info (ikimina_name, monthlytime_day, monthlytime_time, f_id, ikimina_id)
       VALUES (?, ?, ?, ?, ?)`,
      [ikimina_name.trim(), monthlytime_day.trim(), monthlytime_time, f_id, ikimina_id]
    );

    res.status(201).json({ message: 'Monthly time added successfully.' });
  } catch (error) {
    console.error('Error adding monthly time:', error.message);
    res.status(500).json({ message: 'Internal server error while adding monthly time.' });
  }
});

/**
 * PUT: Update existing monthly schedule
 * - Validates ownership
 * - Prevents duplicate ikimina_name in same category
 * - Validates ikimina_id uniqueness across all schedules (except current record)
 */
router.put('/monthly/:id', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { id } = req.params;
  const { ikimina_name, monthlytime_day, monthlytime_time, f_id, ikimina_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !monthlytime_day || !monthlytime_time || !f_id || !ikimina_id) {
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
    const [monthlyTimeRows] = await db.execute(
      'SELECT * FROM Ik_monthly_time_info WHERE monthlytime_id = ? AND f_id = ?',
      [id, f_id]
    );
    if (monthlyTimeRows.length === 0) {
      return res.status(404).json({ message: 'Monthly time not found or unauthorized' });
    }

    // Prevent duplicate ikimina_name in this category (excluding current record)
    const [duplicateName] = await db.execute(
      'SELECT * FROM Ik_monthly_time_info WHERE ikimina_name = ? AND f_id = ? AND monthlytime_id != ?',
      [ikimina_name.trim(), f_id, id]
    );
    if (duplicateName.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already used in this frequency category' });
    }

    // Validate ikimina_id uniqueness across all schedules except current record
    const [daily] = await db.execute(
      'SELECT 1 FROM ik_daily_time_info WHERE ikimina_id = ?',
      [ikimina_id]
    );
    const [weekly] = await db.execute(
      'SELECT 1 FROM Ik_weekly_time_info WHERE ikimina_id = ?',
      [ikimina_id]
    );
    const [monthly] = await db.execute(
      'SELECT 1 FROM Ik_monthly_time_info WHERE ikimina_id = ? AND monthlytime_id != ?',
      [ikimina_id, id]
    );

    if (daily.length > 0 || weekly.length > 0 || monthly.length > 0) {
      return res.status(409).json({
        message: 'This Ikimina already has a schedule in daily, weekly, or monthly.',
      });
    }

    // Update record
    await db.execute(
      `UPDATE Ik_monthly_time_info
       SET ikimina_name = ?, monthlytime_day = ?, monthlytime_time = ?, f_id = ?, ikimina_id = ?
       WHERE monthlytime_id = ?`,
      [ikimina_name.trim(), monthlytime_day.trim(), monthlytime_time, f_id, ikimina_id, id]
    );

    res.status(200).json({ message: 'Monthly time updated successfully.' });
  } catch (error) {
    console.error('Error updating monthly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * DELETE a monthly time record with ownership check
 */
router.delete('/monthly/:id', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { id } = req.params;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const [rows] = await db.execute(
      `SELECT m.monthlytime_id
       FROM Ik_monthly_time_info m
       JOIN frequency_category_info c ON m.f_id = c.f_id
       WHERE m.monthlytime_id = ? AND c.sad_id = ?`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Monthly time not found or unauthorized' });
    }

    await db.execute('DELETE FROM Ik_monthly_time_info WHERE monthlytime_id = ?', [id]);
    res.status(200).json({ message: 'Monthly time deleted successfully.' });
  } catch (error) {
    console.error('Error deleting monthly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
