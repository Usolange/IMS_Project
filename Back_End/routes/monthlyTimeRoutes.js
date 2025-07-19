const express = require('express');
const router = express.Router();
const { sql, poolConnect, pool } = require('../config/db');

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

const TIME_KEYS = ['dtime_time', 'weeklytime_time', 'monthlytime_time', 'timeOfEven'];

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
      // Pass time as string NVARCHAR(8) to avoid timezone and validation issues
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
 * GET all monthly schedules for current user
 */
router.get('/monthly', async (req, res) => {
  const userId = req.query.sad_id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized: user ID missing' });

  try {
    const result = await queryDB(`
      SELECT m.*
      FROM ik_monthly_time_info m
      JOIN frequency_category_info c ON m.f_id = c.f_id
      WHERE c.sad_id = @userId
    `, { userId });

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching monthly schedules:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * POST - Add new monthly schedule (multiple dates)
 */
router.post('/newSchedule', async (req, res) => {
  const sad_id = req.headers['x-sad-id'];
  const { ikimina_name, selected_dates, mtime_time, f_id, location_id } = req.body;

  if (!sad_id) return res.status(401).json({ message: 'Unauthorized' });
  if (
    !ikimina_name ||
    !Array.isArray(selected_dates) ||
    selected_dates.length === 0 ||
    !mtime_time ||
    !f_id ||
    !location_id
  ) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const normalizedTime = normalizeTimeString(mtime_time);
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

    // Insert multiple dates within a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const date of selected_dates) {
        // Validate date is number between 1 and 31
        const dayInt = parseInt(date);
        if (isNaN(dayInt) || dayInt < 1 || dayInt > 31) {
          throw new Error(`Invalid date value: ${date}`);
        }

        const insert = new sql.Request(transaction);
        insert.input('ikimina_name', sql.NVarChar(255), ikimina_name.trim());
        insert.input('monthlytime_date', sql.Int, dayInt);
        insert.input('monthlytime_time', sql.NVarChar(8), normalizedTime);
        insert.input('f_id', sql.Int, f_id);
        insert.input('location_id', sql.Int, location_id);

        await insert.query(`
          INSERT INTO ik_monthly_time_info (ikimina_name, monthlytime_date, monthlytime_time, f_id, location_id)
          VALUES (@ikimina_name, @monthlytime_date, @monthlytime_time, @f_id, @location_id)
        `);
      }

      await transaction.commit();
      res.status(201).json({ message: 'Monthly schedule saved successfully.' });
    } catch (err) {
      await transaction.rollback();
      console.error('Transaction error inserting monthly schedule:', err);
      res.status(500).json({ message: 'Failed to save monthly schedule.' });
    }
  } catch (error) {
    console.error('Error in POST monthly schedule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT - Update a monthly schedule by id
 */
router.put('/:id', async (req, res) => {
  const sad_id = req.headers['x-sad-id'];
  const { id } = req.params;
  const { ikimina_name, monthlytime_date, monthlytime_time, f_id, location_id } = req.body;

  if (!sad_id) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !monthlytime_date || !monthlytime_time || !f_id || !location_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const normalizedTime = normalizeTimeString(monthlytime_time);
  if (!normalizedTime) {
    return res.status(400).json({ message: 'Invalid time format' });
  }

  // Validate monthlytime_date
  const dayInt = parseInt(monthlytime_date);
  if (isNaN(dayInt) || dayInt < 1 || dayInt > 31) {
    return res.status(400).json({ message: 'Invalid monthly date. Must be 1 to 31.' });
  }

  try {
    // Confirm frequency category ownership
    const ownershipCheck = await queryDB('SELECT * FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @sad_id', { f_id, sad_id });
    if (ownershipCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'Unauthorized category access' });
    }

    // Confirm record exists and belongs to frequency category
    const scheduleCheck = await queryDB('SELECT * FROM ik_monthly_time_info WHERE monthlytime_id = @id AND f_id = @f_id', { id, f_id });
    if (scheduleCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Monthly time not found or unauthorized' });
    }

    // Check duplicate ikimina_name in this category excluding current record
    const duplicateName = await queryDB(`
      SELECT 1 FROM ik_monthly_time_info 
      WHERE ikimina_name = @ikimina_name AND f_id = @f_id AND monthlytime_id != @id
    `, { ikimina_name: ikimina_name.trim(), f_id, id });

    if (duplicateName.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists in this category' });
    }

    // Check location_id uniqueness across schedules excluding current record
    const conflicts = await queryDB(`
      SELECT 1 FROM ik_daily_time_info WHERE location_id = @location_id
      UNION
      SELECT 1 FROM ik_weekly_time_info WHERE location_id = @location_id
      UNION
      SELECT 1 FROM ik_monthly_time_info WHERE location_id = @location_id AND monthlytime_id != @id
    `, { location_id, id });

    if (conflicts.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina already has a schedule in another category' });
    }

    // Update record
    await queryDB(`
      UPDATE ik_monthly_time_info
      SET ikimina_name = @ikimina_name,
          monthlytime_date = @monthlytime_date,
          monthlytime_time = @monthlytime_time,
          f_id = @f_id,
          location_id = @location_id
      WHERE monthlytime_id = @id
    `, {
      ikimina_name: ikimina_name.trim(),
      monthlytime_date: dayInt,
      monthlytime_time: normalizedTime,
      f_id,
      location_id,
      id
    });

    res.status(200).json({ message: 'Monthly time updated successfully.' });
  } catch (error) {
    console.error('Error updating monthly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * DELETE - Delete a monthly schedule by id
 */
router.delete('/:id', async (req, res) => {
  const sad_id = req.headers['x-sad-id'];
  const { id } = req.params;

  if (!sad_id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Check ownership
    const check = await queryDB(`
      SELECT m.monthlytime_id
      FROM ik_monthly_time_info m
      JOIN frequency_category_info c ON m.f_id = c.f_id
      WHERE m.monthlytime_id = @id AND c.sad_id = @sad_id
    `, { id, sad_id });

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Record not found or not authorized' });
    }

    // Delete
    await queryDB('DELETE FROM ik_monthly_time_info WHERE monthlytime_id = @id', { id });

    res.status(200).json({ message: 'Monthly schedule deleted successfully.' });
  } catch (error) {
    console.error('Error deleting monthly schedule:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
