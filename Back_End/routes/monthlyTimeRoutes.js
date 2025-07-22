const express = require('express');
const sql = require('mssql');
const { poolConnect, pool } = require('../config/db');

const router = express.Router();

// POST: Create new monthly schedule
router.post('/newSchedule', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { location_id, ikimina_name, selected_dates, mtime_time, f_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!location_id || !ikimina_name || !Array.isArray(selected_dates) || selected_dates.length === 0 || !mtime_time || !f_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await poolConnect;
    const request = pool.request();

    // Verify frequency category ownership
    const categoryCheck = await request
      .input('f_id', sql.Int, f_id)
      .input('sad_id', sql.Int, userId)
      .query(`SELECT * FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @sad_id`);
    if (categoryCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'Unauthorized frequency category' });
    }

    // Check for existing schedule
    const conflict = await pool.request()
      .input('location_id', sql.Int, location_id)
      .query(`
        SELECT TOP 1 1 FROM ik_daily_time_info WHERE location_id = @location_id
        UNION
        SELECT TOP 1 1 FROM ik_weekly_time_info WHERE location_id = @location_id
        UNION
        SELECT TOP 1 1 FROM ik_monthly_time_info WHERE location_id = @location_id
      `);
    if (conflict.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina already has a schedule.' });
    }

    // Check if ikimina_name exists
    const nameCheck = await pool.request()
      .input('ikimina_name', sql.NVarChar(255), ikimina_name.trim())
      .input('f_id', sql.Int, f_id)
      .query(`SELECT 1 FROM ik_monthly_time_info WHERE ikimina_name = @ikimina_name AND f_id = @f_id`);
    if (nameCheck.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists.' });
    }

    // Insert into monthly table (transaction)
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const date of selected_dates) {
        await new sql.Request(transaction)
          .input('ikimina_name', sql.NVarChar(255), ikimina_name.trim())
          .input('monthlytime_date', sql.NVarChar(10), date.trim())
          .input('monthlytime_time', sql.NVarChar(8), mtime_time)
          .input('f_id', sql.Int, f_id)
          .input('location_id', sql.Int, location_id)
          .query(`
            INSERT INTO ik_monthly_time_info (ikimina_name, monthlytime_date, monthlytime_time, f_id, location_id)
            VALUES (@ikimina_name, @monthlytime_date, @monthlytime_time, @f_id, @location_id)
          `);
      }
      await transaction.commit();
      res.status(201).json({ message: 'Monthly schedule saved successfully.' });
    } catch (err) {
      await transaction.rollback();
      console.error('Transaction error:', err.message);
      res.status(500).json({ message: 'Failed to save monthly schedule.' });
    }
  } catch (error) {
    console.error('Error in /newSchedule:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT: Update monthly schedule
router.put('/monthly/:id', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { id } = req.params;
  const { ikimina_name, monthlytime_day, monthlytime_time, f_id, location_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !monthlytime_day || !monthlytime_time || !f_id || !location_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await poolConnect;

    // Validate category ownership
    const categoryCheck = await pool.request()
      .input('f_id', sql.Int, f_id)
      .input('sad_id', sql.Int, userId)
      .query('SELECT * FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @sad_id');
    if (categoryCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'Unauthorized frequency category' });
    }

    // Check record existence
    const recordCheck = await pool.request()
      .input('id', sql.Int, id)
      .input('f_id', sql.Int, f_id)
      .query('SELECT * FROM ik_monthly_time_info WHERE monthlytime_id = @id AND f_id = @f_id');
    if (recordCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Prevent name duplicates
    const nameCheck = await pool.request()
      .input('ikimina_name', sql.NVarChar(255), ikimina_name.trim())
      .input('f_id', sql.Int, f_id)
      .input('id', sql.Int, id)
      .query('SELECT 1 FROM ik_monthly_time_info WHERE ikimina_name = @ikimina_name AND f_id = @f_id AND monthlytime_id != @id');
    if (nameCheck.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists' });
    }

    // Conflict on location
    const conflict = await pool.request()
      .input('location_id', sql.Int, location_id)
      .input('id', sql.Int, id)
      .query(`
        SELECT 1 FROM ik_daily_time_info WHERE location_id = @location_id
        UNION
        SELECT 1 FROM ik_weekly_time_info WHERE location_id = @location_id
        UNION
        SELECT 1 FROM ik_monthly_time_info WHERE location_id = @location_id AND monthlytime_id != @id
      `);
    if (conflict.recordset.length > 0) {
      return res.status(409).json({ message: 'This Ikimina already has a schedule' });
    }

    // Perform update
    await pool.request()
      .input('ikimina_name', sql.NVarChar(255), ikimina_name.trim())
      .input('monthlytime_day', sql.NVarChar(20), monthlytime_day.trim())
      .input('monthlytime_time', sql.NVarChar(8), monthlytime_time)
      .input('f_id', sql.Int, f_id)
      .input('location_id', sql.Int, location_id)
      .input('id', sql.Int, id)
      .query(`
        UPDATE ik_monthly_time_info
        SET ikimina_name = @ikimina_name,
            monthlytime_day = @monthlytime_day,
            monthlytime_time = @monthlytime_time,
            f_id = @f_id,
            location_id = @location_id
        WHERE monthlytime_id = @id
      `);

    res.status(200).json({ message: 'Monthly schedule updated successfully' });
  } catch (error) {
    console.error('Error updating monthly time:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE: Remove a monthly time record
router.delete('/monthly/:id', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { id } = req.params;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    await poolConnect;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('sad_id', sql.Int, userId)
      .query(`
        SELECT m.monthlytime_id
        FROM ik_monthly_time_info m
        JOIN frequency_category_info c ON m.f_id = c.f_id
        WHERE m.monthlytime_id = @id AND c.sad_id = @sad_id
      `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Record not found or unauthorized' });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM ik_monthly_time_info WHERE monthlytime_id = @id');

    res.status(200).json({ message: 'Monthly time deleted successfully' });
  } catch (error) {
    console.error('Error deleting monthly time:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
