const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');

// Helper to run queries with parameters
async function queryDB(query, inputs = {}) {
  const request = pool.request();
  for (const [key, value] of Object.entries(inputs)) {
    request.input(key, value);
  }
  return request.query(query);
}

/**
 * GET all daily times created by the logged-in user
 */
router.get('/daily', async (req, res) => {
  const userId = req.query.sad_id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: user ID missing' });
  }

  try {
    const query = `
      SELECT d.*
      FROM ik_daily_time_info d
      JOIN frequency_category_info c ON d.f_id = c.f_id
      WHERE c.sad_id = @userId
    `;
    const result = await queryDB(query, { userId });
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching daily times:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/newSchedule', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { ikimina_name, dtime_time, f_id, location_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !dtime_time || !f_id || !location_id) {
    return res.status(400).json({ message: 'Missing required fields: ikimina_name, dtime_time, f_id, or location_id' });
  }

  try {
    // Verify ownership of category
    const categoryCheckQuery = 'SELECT * FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @userId';
    const categoryResult = await queryDB(categoryCheckQuery, { f_id, userId });

    if (categoryResult.recordset.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Check if schedule exists in any frequency tables for location
    const dailyCheck = await queryDB('SELECT 1 FROM ik_daily_time_info WHERE location_id = @location_id', { location_id });
    const weeklyCheck = await queryDB('SELECT 1 FROM ik_weekly_time_info WHERE location_id = @location_id', { location_id });
    const monthlyCheck = await queryDB('SELECT 1 FROM ik_monthly_time_info WHERE location_id = @location_id', { location_id });

    if (dailyCheck.recordset.length > 0 || weeklyCheck.recordset.length > 0 || monthlyCheck.recordset.length > 0) {
      return res.status(409).json({ message: 'This Ikimina already has a schedule in daily, weekly, or monthly.' });
    }

    // Ensure no duplicate ikimina name in same frequency category
    const existingCheckQuery = 'SELECT * FROM ik_daily_time_info WHERE location_id = @location_id AND f_id = @f_id';
    const existingResult = await queryDB(existingCheckQuery, { location_id, f_id });

    if (existingResult.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina already exists for this frequency category.' });
    }

    // Insert new daily schedule
    const insertQuery = `
      INSERT INTO ik_daily_time_info (ikimina_name, dtime_time, f_id, location_id)
      VALUES (@ikimina_name, @dtime_time, @f_id, @location_id)
    `;
    await queryDB(insertQuery, { ikimina_name, dtime_time, f_id, location_id });

    res.status(201).json({ message: 'Daily time saved successfully.' });
  } catch (error) {
    console.error('Error saving daily time:', error.message);
    res.status(500).json({ message: 'Failed to save daily time.' });
  }
});

/**
 * PUT: Update existing daily schedule
 * - Validates category ownership
 * - Prevents name duplication
 */
router.put('/:id', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { ikimina_name, dtime_time, f_id } = req.body;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!dtime_time || !f_id) {
    return res.status(400).json({ message: 'Missing dtime_time or f_id' });
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

    // Prevent duplicate names for the same category
    if (ikimina_name) {
      const duplicateCheck = `
        SELECT * FROM ik_daily_time_info 
        WHERE ikimina_name = @ikimina_name AND f_id = @f_id AND dtime_id != @id
      `;
      const duplicateResult = await queryDB(duplicateCheck, { ikimina_name, f_id, id });

      if (duplicateResult.recordset.length > 0) {
        return res.status(409).json({ message: 'Ikimina name already exists for this frequency category' });
      }
    }

    // Update daily schedule
    const updateQuery = `
      UPDATE ik_daily_time_info 
      SET ikimina_name = @ikimina_name, dtime_time = @dtime_time, f_id = @f_id 
      WHERE dtime_id = @id
    `;
    await queryDB(updateQuery, { ikimina_name, dtime_time, f_id, id });

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
