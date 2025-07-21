const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');

/**
 * Normalize time string to HH:mm:ss format.
 * Accepts HH:mm or HH:mm:ss.
 * Returns normalized string or null if invalid.
 */
function normalizeTimeString(value) {
  if (!value) return null;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  if (!timeRegex.test(value)) return null;

  const parts = value.split(':');
  const hh = parts[0];
  const mm = parts[1];
  const ss = parts[2] || '00'; // add seconds if missing
  return `${hh}:${mm}:${ss}`;
}

/**
 * Check if a string is a valid time (HH:mm or HH:mm:ss).
 */
function isTimeString(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(value);
}

/**
 * Helper function to run SQL queries with inputs.
 * Times are passed as NVARCHAR(8) strings.
 */
async function queryDB(query, inputs = {}) {
  await poolConnect;
  const request = pool.request();

  for (const [key, value] of Object.entries(inputs)) {
    if (typeof value === 'number') {
      request.input(key, sql.Int, value);
    } else if (isTimeString(value)) {
      const normalized = normalizeTimeString(value);
      if (!normalized) throw new Error(`Invalid time format for parameter ${key}: ${value}`);
      // Pass time as NVARCHAR(8) string
      request.input(key, sql.NVarChar(8), normalized);
    } else {
      request.input(key, sql.NVarChar(sql.MAX), value);
    }
  }

  return request.query(query);
}

/**
 * POST new daily schedule
 */
router.post('/newSchedule', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { ikimina_name, dtime_time, f_id, location_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !dtime_time || !f_id || !location_id) {
    return res.status(400).json({ message: 'Missing required fields: ikimina_name, dtime_time, f_id, or location_id' });
  }

  try {
    // Verify frequency category ownership
    const categoryCheckQuery = 'SELECT * FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @userId';
    const categoryResult = await queryDB(categoryCheckQuery, { f_id, userId });

    if (categoryResult.recordset.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Check if any schedule already exists for this location (daily/weekly/monthly)
    const dailyCheck = await queryDB('SELECT TOP 1 1 FROM ik_daily_time_info WHERE location_id = @location_id', { location_id });
    const weeklyCheck = await queryDB('SELECT TOP 1 1 FROM ik_weekly_time_info WHERE location_id = @location_id', { location_id });
    const monthlyCheck = await queryDB('SELECT TOP 1 1 FROM ik_monthly_time_info WHERE location_id = @location_id', { location_id });

    if (dailyCheck.recordset.length > 0 || weeklyCheck.recordset.length > 0 || monthlyCheck.recordset.length > 0) {
      return res.status(409).json({ message: 'This Ikimina location already has a schedule in daily, weekly, or monthly.' });
    }

    // Ensure no duplicate ikimina_name in same frequency category
    const existingCheckQuery = 'SELECT TOP 1 1 FROM ik_daily_time_info WHERE ikimina_name = @ikimina_name AND f_id = @f_id';
    const existingResult = await queryDB(existingCheckQuery, { ikimina_name: ikimina_name.trim(), f_id });

    if (existingResult.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists for this frequency category.' });
    }

    // Insert new daily schedule with time as string
    const insertQuery = `
      INSERT INTO ik_daily_time_info (ikimina_name, dtime_time, f_id, location_id)
      VALUES (@ikimina_name, @dtime_time, @f_id, @location_id)
    `;
    await queryDB(insertQuery, {
      ikimina_name: ikimina_name.trim(),
      dtime_time: normalizeTimeString(dtime_time),
      f_id,
      location_id,
    });

    res.status(201).json({ message: 'Daily time saved successfully.' });
  } catch (error) {
    console.error('Error saving daily time:', error.message);
    res.status(500).json({ message: 'Failed to save daily time.' });
  }
});

/**
 * PUT update daily schedule by id
 */
router.put('/:id', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { ikimina_name, dtime_time, f_id, location_id } = req.body;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !dtime_time || !f_id || !location_id) {
    return res.status(400).json({ message: 'Missing required fields: ikimina_name, dtime_time, f_id, or location_id' });
  }

  try {
    // Confirm ownership of frequency category
    const categoryCheck = 'SELECT * FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @userId';
    const categoryResult = await queryDB(categoryCheck, { f_id, userId });

    if (categoryResult.recordset.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Confirm this daily record exists and belongs to the same category
    const dailyCheck = 'SELECT * FROM ik_daily_time_info WHERE dtime_id = @id AND f_id = @f_id';
    const dailyResult = await queryDB(dailyCheck, { id, f_id });

    if (dailyResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Daily time not found or unauthorized' });
    }

    // Prevent duplicate ikimina_name for the same category (exclude current record)
    const duplicateCheck = `
      SELECT TOP 1 1 FROM ik_daily_time_info
      WHERE ikimina_name = @ikimina_name AND f_id = @f_id AND dtime_id != @id
    `;
    const duplicateResult = await queryDB(duplicateCheck, { ikimina_name: ikimina_name.trim(), f_id, id });

    if (duplicateResult.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists for this frequency category' });
    }

    // Check if location_id is already used in other schedules (except this record)
    const dailyLocationCheck = await queryDB('SELECT TOP 1 1 FROM ik_daily_time_info WHERE location_id = @location_id AND dtime_id != @id', { location_id, id });
    const weeklyLocationCheck = await queryDB('SELECT TOP 1 1 FROM ik_weekly_time_info WHERE location_id = @location_id', { location_id });
    const monthlyLocationCheck = await queryDB('SELECT TOP 1 1 FROM ik_monthly_time_info WHERE location_id = @location_id', { location_id });

    if (dailyLocationCheck.recordset.length > 0 || weeklyLocationCheck.recordset.length > 0 || monthlyLocationCheck.recordset.length > 0) {
      return res.status(409).json({ message: 'This Ikimina location already has a schedule in daily, weekly, or monthly.' });
    }

    // Update daily schedule
    const updateQuery = `
      UPDATE ik_daily_time_info
      SET ikimina_name = @ikimina_name, dtime_time = @dtime_time, f_id = @f_id, location_id = @location_id
      WHERE dtime_id = @id
    `;
    await queryDB(updateQuery, {
      ikimina_name: ikimina_name.trim(),
      dtime_time: normalizeTimeString(dtime_time),
      f_id,
      location_id,
      id,
    });

    res.status(200).json({ message: 'Daily time updated successfully.' });
  } catch (error) {
    console.error('Error updating daily time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * DELETE a daily time record with ownership check
 */
router.delete('/:id', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { id } = req.params;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const checkQuery = `
      SELECT d.dtime_id
      FROM ik_daily_time_info d
      JOIN frequency_category_info c ON d.f_id = c.f_id
      WHERE d.dtime_id = @id AND c.sad_id = @userId
    `;
    const checkResult = await queryDB(checkQuery, { id, userId });

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Daily time not found or unauthorized' });
    }

    const deleteQuery = 'DELETE FROM ik_daily_time_info WHERE dtime_id = @id';
    await queryDB(deleteQuery, { id });

    res.status(200).json({ message: 'Daily time deleted successfully.' });
  } catch (error) {
    console.error('Error deleting daily time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
