const express = require('express');
const router = express.Router();
const { sql, poolConnect, pool } = require('../config/db');

/**
 * GET all weekly times created by the logged-in user
 */
router.get('/weekly', async (req, res) => {
  const userId = req.query.sad_id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: user ID missing' });
  }

  try {
    await poolConnect;
    const request = pool.request();
    request.input('userId', sql.Int, userId);

    const result = await request.query(`
      SELECT w.*
      FROM Ik_weekly_time_info w
      JOIN frequency_category_info c ON w.f_id = c.f_id
      WHERE c.sad_id = @userId
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching weekly times:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * POST new weekly schedule
 */
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
    await poolConnect;

    // Verify category ownership
    let request = pool.request();
    request.input('f_id', sql.Int, f_id);
    request.input('userId', sql.Int, userId);
    let result = await request.query(`
      SELECT * FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @userId
    `);
    if (result.recordset.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Check existing schedules for this location_id
    request = pool.request();
    request.input('location_id', sql.Int, location_id);

    const dailyRes = await request.query('SELECT 1 FROM ik_daily_time_info WHERE location_id = @location_id');
    const weeklyRes = await request.query('SELECT 1 FROM ik_weekly_time_info WHERE location_id = @location_id');
    const monthlyRes = await request.query('SELECT 1 FROM ik_monthly_time_info WHERE location_id = @location_id');

    if (dailyRes.recordset.length > 0 || weeklyRes.recordset.length > 0 || monthlyRes.recordset.length > 0) {
      return res.status(409).json({ message: 'This Ikimina already has a schedule.' });
    }

    // Check if ikimina_name already exists in weekly schedules for this category
    request = pool.request();
    request.input('ikimina_name', sql.VarChar(255), ikimina_name.trim());
    request.input('f_id', sql.Int, f_id);

    result = await request.query(`
      SELECT * FROM ik_weekly_time_info WHERE ikimina_name = @ikimina_name AND f_id = @f_id
    `);

    if (result.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists for this frequency category.' });
    }

    // Insert weekly schedule for each selected day
    // Prepare batch inserts with parameterized queries
    const insertPromises = selected_days.map(day => {
      const insertReq = pool.request();
      insertReq.input('ikimina_name', sql.VarChar(255), ikimina_name.trim());
      insertReq.input('weeklytime_day', sql.VarChar(20), day.trim());
      insertReq.input('weeklytime_time', sql.VarChar(10), wtime_time);
      insertReq.input('f_id', sql.Int, f_id);
      insertReq.input('location_id', sql.Int, location_id);

      return insertReq.query(`
        INSERT INTO ik_weekly_time_info (ikimina_name, weeklytime_day, weeklytime_time, f_id, location_id)
        VALUES (@ikimina_name, @weeklytime_day, @weeklytime_time, @f_id, @location_id)
      `);
    });

    await Promise.all(insertPromises);

    res.status(201).json({ message: 'Weekly schedule saved successfully.' });
  } catch (error) {
    console.error('Error saving weekly schedule:', error.message);
    res.status(500).json({ message: 'Internal server error while saving weekly schedule.' });
  }
});

/**
 * PUT update weekly time record
 */
router.put('/:id', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { id } = req.params;
  const { ikimina_name, weeklytime_day, weeklytime_time, f_id, location_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !weeklytime_day || !weeklytime_time || !f_id || !location_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await poolConnect;

    // Confirm ownership of frequency category
    let request = pool.request();
    request.input('f_id', sql.Int, f_id);
    request.input('userId', sql.Int, userId);
    let result = await request.query(`
      SELECT * FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @userId
    `);
    if (result.recordset.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Confirm record exists and belongs to category
    request = pool.request();
    request.input('weeklytime_id', sql.Int, id);
    request.input('f_id', sql.Int, f_id);
    result = await request.query(`
      SELECT * FROM Ik_weekly_time_info WHERE weeklytime_id = @weeklytime_id AND f_id = @f_id
    `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Weekly time not found or unauthorized' });
    }

    // Prevent duplicate ikimina_name in this category (excluding current record)
    request = pool.request();
    request.input('ikimina_name', sql.VarChar(255), ikimina_name.trim());
    request.input('f_id', sql.Int, f_id);
    request.input('weeklytime_id', sql.Int, id);

    result = await request.query(`
      SELECT * FROM Ik_weekly_time_info
      WHERE ikimina_name = @ikimina_name AND f_id = @f_id AND weeklytime_id != @weeklytime_id
    `);

    if (result.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already used in this frequency category' });
    }

    // Validate location_id uniqueness across all schedules except current record
    request = pool.request();
    request.input('location_id', sql.Int, location_id);
    result = await request.query('SELECT 1 FROM ik_daily_time_info WHERE location_id = @location_id');
    if (result.recordset.length > 0) {
      return res.status(409).json({ message: 'This Ikimina already has a schedule in daily.' });
    }

    request = pool.request();
    request.input('location_id', sql.Int, location_id);
    request.input('weeklytime_id', sql.Int, id);
    result = await request.query('SELECT 1 FROM Ik_weekly_time_info WHERE location_id = @location_id AND weeklytime_id != @weeklytime_id');
    if (result.recordset.length > 0) {
      return res.status(409).json({ message: 'This Ikimina already has a schedule in weekly.' });
    }

    request = pool.request();
    request.input('location_id', sql.Int, location_id);
    result = await request.query('SELECT 1 FROM Ik_monthly_time_info WHERE location_id = @location_id');
    if (result.recordset.length > 0) {
      return res.status(409).json({ message: 'This Ikimina already has a schedule in monthly.' });
    }

    // Update record
    request = pool.request();
    request.input('ikimina_name', sql.VarChar(255), ikimina_name.trim());
    request.input('weeklytime_day', sql.VarChar(20), weeklytime_day.trim());
    request.input('weeklytime_time', sql.VarChar(10), weeklytime_time);
    request.input('f_id', sql.Int, f_id);
    request.input('location_id', sql.Int, location_id);
    request.input('weeklytime_id', sql.Int, id);

    await request.query(`
      UPDATE Ik_weekly_time_info
      SET ikimina_name = @ikimina_name,
          weeklytime_day = @weeklytime_day,
          weeklytime_time = @weeklytime_time,
          f_id = @f_id,
          location_id = @location_id
      WHERE weeklytime_id = @weeklytime_id
    `);

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
    await poolConnect;
    let request = pool.request();
    request.input('weeklytime_id', sql.Int, id);
    request.input('userId', sql.Int, userId);

    const result = await request.query(`
      SELECT w.weeklytime_id
      FROM Ik_weekly_time_info w
      JOIN frequency_category_info c ON w.f_id = c.f_id
      WHERE w.weeklytime_id = @weeklytime_id AND c.sad_id = @userId
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Weekly time not found or unauthorized' });
    }

    request = pool.request();
    request.input('weeklytime_id', sql.Int, id);
    await request.query('DELETE FROM Ik_weekly_time_info WHERE weeklytime_id = @weeklytime_id');

    res.status(200).json({ message: 'Weekly time deleted successfully.' });
  } catch (error) {
    console.error('Error deleting weekly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
