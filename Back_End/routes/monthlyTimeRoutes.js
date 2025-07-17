const express = require('express');
const router = express.Router();
const { sql, pool } = require('../config/db');

// POST: Add new monthly schedules (multiple dates)
router.post('/newSchedule', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { location_id, ikimina_name, selected_dates, mtime_time, f_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (
    !location_id ||
    !ikimina_name ||
    !Array.isArray(selected_dates) ||
    selected_dates.length === 0 ||
    !mtime_time ||
    !f_id
  ) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Verify user owns the frequency category
    const freqCatResult = await pool.request()
      .input('f_id', sql.Int, f_id)
      .input('sad_id', sql.Int, userId)
      .query('SELECT * FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @sad_id');

    if (freqCatResult.recordset.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Check if this ikimina already has any schedule in daily, weekly or monthly tables
    const dailyResult = await pool.request()
      .input('location_id', sql.Int, location_id)
      .query('SELECT TOP 1 1 FROM ik_daily_time_info WHERE location_id = @location_id');
    const weeklyResult = await pool.request()
      .input('location_id', sql.Int, location_id)
      .query('SELECT TOP 1 1 FROM ik_weekly_time_info WHERE location_id = @location_id');
    const monthlyResult = await pool.request()
      .input('location_id', sql.Int, location_id)
      .query('SELECT TOP 1 1 FROM ik_monthly_time_info WHERE location_id = @location_id');

    if (
      dailyResult.recordset.length > 0 ||
      weeklyResult.recordset.length > 0 ||
      monthlyResult.recordset.length > 0
    ) {
      return res.status(409).json({ message: 'This Ikimina already has a schedule.' });
    }

    // Check if ikimina_name already exists for this category in monthly schedules
    const existingNameResult = await pool.request()
      .input('ikimina_name', sql.NVarChar(255), ikimina_name.trim())
      .input('f_id', sql.Int, f_id)
      .query('SELECT TOP 1 1 FROM ik_monthly_time_info WHERE ikimina_name = @ikimina_name AND f_id = @f_id');

    if (existingNameResult.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists for this frequency category.' });
    }

    // Insert one row per selected date (inside transaction)
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const date of selected_dates) {
        const request = new sql.Request(transaction);  // <--- NEW request per iteration
        await request
          .input('ikimina_name', sql.NVarChar(255), ikimina_name.trim())
          .input('monthlytime_date', sql.NVarChar(50), date.trim())
          .input('monthlytime_time', sql.NVarChar(50), mtime_time)
          .input('f_id', sql.Int, f_id)
          .input('location_id', sql.Int, location_id)
          .query(
            `INSERT INTO ik_monthly_time_info
            (ikimina_name, monthlytime_date, monthlytime_time, f_id, location_id)
            VALUES (@ikimina_name, @monthlytime_date, @monthlytime_time, @f_id, @location_id)`
          );
      }

      await transaction.commit();
      res.status(201).json({ message: 'Monthly schedule saved successfully.' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error saving monthly schedule:', error.message);
    res.status(500).json({ message: 'Internal server error while saving monthly schedule.' });
  }
});

// PUT: Update a monthly schedule by id
router.put('/monthly/:id', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { id } = req.params;
  const { ikimina_name, monthlytime_day, monthlytime_time, f_id, location_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !monthlytime_day || !monthlytime_time || !f_id || !location_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Confirm ownership of frequency category
    const categoryResult = await pool.request()
      .input('f_id', sql.Int, f_id)
      .input('sad_id', sql.Int, userId)
      .query('SELECT * FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @sad_id');

    if (categoryResult.recordset.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Confirm record exists and belongs to category
    const monthlyTimeResult = await pool.request()
      .input('monthlytime_id', sql.Int, id)
      .input('f_id', sql.Int, f_id)
      .query('SELECT * FROM ik_monthly_time_info WHERE monthlytime_id = @monthlytime_id AND f_id = @f_id');

    if (monthlyTimeResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Monthly time not found or unauthorized' });
    }

    // Prevent duplicate ikimina_name in this category (excluding current record)
    const duplicateNameResult = await pool.request()
      .input('ikimina_name', sql.NVarChar(255), ikimina_name.trim())
      .input('f_id', sql.Int, f_id)
      .input('monthlytime_id', sql.Int, id)
      .query('SELECT * FROM ik_monthly_time_info WHERE ikimina_name = @ikimina_name AND f_id = @f_id AND monthlytime_id != @monthlytime_id');

    if (duplicateNameResult.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already used in this frequency category' });
    }

    // Validate location_id uniqueness across all schedules except current record
    const dailyResult = await pool.request()
      .input('location_id', sql.Int, location_id)
      .query('SELECT TOP 1 1 FROM ik_daily_time_info WHERE location_id = @location_id');
    const weeklyResult = await pool.request()
      .input('location_id', sql.Int, location_id)
      .query('SELECT TOP 1 1 FROM ik_weekly_time_info WHERE location_id = @location_id');
    const monthlyResult = await pool.request()
      .input('location_id', sql.Int, location_id)
      .input('monthlytime_id', sql.Int, id)
      .query('SELECT TOP 1 1 FROM ik_monthly_time_info WHERE location_id = @location_id AND monthlytime_id != @monthlytime_id');

    if (
      dailyResult.recordset.length > 0 ||
      weeklyResult.recordset.length > 0 ||
      monthlyResult.recordset.length > 0
    ) {
      return res.status(409).json({
        message: 'This Ikimina already has a schedule in daily, weekly, or monthly.',
      });
    }

    // Update record
    await pool.request()
      .input('ikimina_name', sql.NVarChar(255), ikimina_name.trim())
      .input('monthlytime_day', sql.NVarChar(50), monthlytime_day.trim())
      .input('monthlytime_time', sql.NVarChar(50), monthlytime_time)
      .input('f_id', sql.Int, f_id)
      .input('location_id', sql.Int, location_id)
      .input('monthlytime_id', sql.Int, id)
      .query(
        `UPDATE ik_monthly_time_info
         SET ikimina_name = @ikimina_name,
             monthlytime_day = @monthlytime_day,
             monthlytime_time = @monthlytime_time,
             f_id = @f_id,
             location_id = @location_id
         WHERE monthlytime_id = @monthlytime_id`
      );

    res.status(200).json({ message: 'Monthly time updated successfully.' });
  } catch (error) {
    console.error('Error updating monthly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE a monthly schedule by id
router.delete('/monthly/:id', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { id } = req.params;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const rows = await pool.request()
      .input('monthlytime_id', sql.Int, id)
      .input('sad_id', sql.Int, userId)
      .query(
        `SELECT m.monthlytime_id
         FROM ik_monthly_time_info m
         INNER JOIN frequency_category_info c ON m.f_id = c.f_id
         WHERE m.monthlytime_id = @monthlytime_id AND c.sad_id = @sad_id`
      );

    if (rows.recordset.length === 0) {
      return res.status(404).json({ message: 'Monthly time not found or unauthorized' });
    }

    await pool.request()
      .input('monthlytime_id', sql.Int, id)
      .query('DELETE FROM ik_monthly_time_info WHERE monthlytime_id = @monthlytime_id');

    res.status(200).json({ message: 'Monthly time deleted successfully.' });
  } catch (error) {
    console.error('Error deleting monthly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
