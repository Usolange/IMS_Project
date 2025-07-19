const express = require('express');
const router = express.Router();
const { sql, poolConnect, pool } = require('../config/db');

const TIME_KEYS = ['dtime_time', 'weeklytime_time', 'monthlytime_time', 'timeOfEven'];

/**
 * Normalize time string to HH:mm:ss format for SQL Server Time type
 */
function normalizeTimeString(value) {
  if (!value) return null;
  const timeRegex = /^\d{2}:\d{2}(:\d{2})?(\.\d{1,7})?$/;
  if (!timeRegex.test(value)) return null;

  const parts = value.split(':');
  const hh = parts[0];
  const mm = parts[1];
  let ss = '00';
  if (parts.length > 2) {
    ss = parts[2].split('.')[0];
  }
  return `${hh}:${mm}:${ss}`;
}

/**
 * Generic DB query helper with correct typing
 */
async function queryDB(query, inputs = {}) {
  await poolConnect;
  const request = pool.request();

  for (const [key, value] of Object.entries(inputs)) {
    if (TIME_KEYS.includes(key)) {
      const normalized = normalizeTimeString(value);
      if (!normalized) throw new Error(`Invalid time format for parameter ${key}: ${value}`);
      // Pass as NVARCHAR(8) to avoid timezone/validation issues
      request.input(key, sql.NVarChar(8), normalized);
    } else if (typeof value === 'number') {
      request.input(key, sql.Int, value);
    } else {
      request.input(key, sql.NVarChar(sql.MAX), value);
    }
  }

  return request.query(query);
}

/**
 * GET all weekly schedules for current user
 */
router.get('/weekly', async (req, res) => {
  const userId = req.query.sad_id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized: user ID missing' });

  try {
    const result = await queryDB(`
      SELECT w.*
      FROM ik_weekly_time_info w
      JOIN frequency_category_info c ON w.f_id = c.f_id
      WHERE c.sad_id = @userId
    `, { userId });

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching weekly schedules:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * POST - Add new weekly schedule (multiple days)
 */
router.post('/newSchedule', async (req, res) => {
  const sad_id = req.headers['x-sad-id'];
  const { ikimina_name, selected_days, wtime_time, f_id, location_id } = req.body;

  if (!sad_id) return res.status(401).json({ message: 'Unauthorized' });
  if (
    !ikimina_name ||
    !Array.isArray(selected_days) ||
    selected_days.length === 0 ||
    !wtime_time ||
    !f_id ||
    !location_id
  ) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const normalizedTime = normalizeTimeString(wtime_time);
  if (!normalizedTime) {
    return res.status(400).json({ message: 'Invalid time format' });
  }

  try {
    await poolConnect;

    // Verify frequency category ownership
    const categoryCheck = await queryDB('SELECT * FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @sad_id', { f_id, sad_id });
    if (categoryCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'Unauthorized access to frequency category' });
    }

    // Check if Ikimina already has any schedule in daily, weekly, monthly
    const conflictRes = await queryDB(`
      SELECT TOP 1 1 FROM ik_daily_time_info WHERE location_id = @location_id
      UNION
      SELECT TOP 1 1 FROM ik_weekly_time_info WHERE location_id = @location_id
      UNION
      SELECT TOP 1 1 FROM ik_monthly_time_info WHERE location_id = @location_id
    `, { location_id });

    if (conflictRes.recordset.length > 0) {
      return res.status(409).json({ message: 'This Ikimina already has a schedule.' });
    }

    // Insert multiple days within a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const day of selected_days) {
        const insert = new sql.Request(transaction);
        insert.input('ikimina_name', sql.NVarChar(255), ikimina_name.trim());
        insert.input('weeklytime_day', sql.NVarChar(20), day.trim());
        insert.input('weeklytime_time', sql.NVarChar(8), normalizedTime);
        insert.input('f_id', sql.Int, f_id);
        insert.input('location_id', sql.Int, location_id);

        await insert.query(`
          INSERT INTO ik_weekly_time_info (ikimina_name, weeklytime_day, weeklytime_time, f_id, location_id)
          VALUES (@ikimina_name, @weeklytime_day, @weeklytime_time, @f_id, @location_id)
        `);
      }

      await transaction.commit();
      res.status(201).json({ message: 'Weekly schedule saved successfully.' });
    } catch (err) {
      await transaction.rollback();
      console.error('Transaction error inserting weekly schedule:', err);
      res.status(500).json({ message: 'Failed to save weekly schedule.' });
    }
  } catch (error) {
    console.error('Error in POST weekly schedule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT - Update a weekly schedule by id
 */
router.put('/:id', async (req, res) => {
  const sad_id = req.headers['x-sad-id'];
  const { id } = req.params;
  const { ikimina_name, weeklytime_day, weeklytime_time, f_id, location_id } = req.body;

  if (!sad_id) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !weeklytime_day || !weeklytime_time || !f_id || !location_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const normalizedTime = normalizeTimeString(weeklytime_time);
  if (!normalizedTime) {
    return res.status(400).json({ message: 'Invalid time format' });
  }

  try {
    // Confirm frequency category ownership
    const ownershipCheck = await queryDB('SELECT * FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @sad_id', { f_id, sad_id });
    if (ownershipCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'Unauthorized category access' });
    }

    // Confirm record exists and belongs to frequency category
    const scheduleCheck = await queryDB('SELECT * FROM ik_weekly_time_info WHERE weeklytime_id = @id AND f_id = @f_id', { id, f_id });
    if (scheduleCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Weekly time not found or unauthorized' });
    }

    // Check duplicate ikimina_name in this category excluding current record
    const duplicateName = await queryDB(`
      SELECT 1 FROM ik_weekly_time_info 
      WHERE ikimina_name = @ikimina_name AND f_id = @f_id AND weeklytime_id != @id
    `, { ikimina_name: ikimina_name.trim(), f_id, id });

    if (duplicateName.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists in this category' });
    }

    // Check location_id uniqueness across schedules excluding current record
    const conflicts = await queryDB(`
      SELECT 1 FROM ik_daily_time_info WHERE location_id = @location_id
      UNION
      SELECT 1 FROM ik_weekly_time_info WHERE location_id = @location_id AND weeklytime_id != @id
      UNION
      SELECT 1 FROM ik_monthly_time_info WHERE location_id = @location_id
    `, { location_id, id });

    if (conflicts.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina already has a schedule in another category' });
    }

    // Update record
    await queryDB(`
      UPDATE ik_weekly_time_info
      SET ikimina_name = @ikimina_name,
          weeklytime_day = @weeklytime_day,
          weeklytime_time = @weeklytime_time,
          f_id = @f_id,
          location_id = @location_id
      WHERE weeklytime_id = @id
    `, { ikimina_name: ikimina_name.trim(), weeklytime_day: weeklytime_day.trim(), weeklytime_time: normalizedTime, f_id, location_id, id });

    res.status(200).json({ message: 'Weekly time updated successfully.' });
  } catch (error) {
    console.error('Error updating weekly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * DELETE - Delete a weekly schedule by id
 */
router.delete('/:id', async (req, res) => {
  const sad_id = req.headers['x-sad-id'];
  const { id } = req.params;

  if (!sad_id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Check ownership
    const check = await queryDB(`
      SELECT w.weeklytime_id
      FROM ik_weekly_time_info w
      JOIN frequency_category_info c ON w.f_id = c.f_id
      WHERE w.weeklytime_id = @id AND c.sad_id = @sad_id
    `, { id, sad_id });

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Record not found or not authorized' });
    }

    // Delete
    await queryDB('DELETE FROM ik_weekly_time_info WHERE weeklytime_id = @id', { id });

    res.status(200).json({ message: 'Weekly schedule deleted successfully.' });
  } catch (error) {
    console.error('Error deleting weekly schedule:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
