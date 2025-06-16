const express = require('express');
const db = require('../config/db');

const router = express.Router();


/**
 * GET all daily times created by the logged-in user
 */
router.get('/daily', async (req, res) => {
  const userId = req.query.sad_id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: user ID missing' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT d.*
       FROM ik_daily_time_info d
       JOIN frequency_category_info c ON d.f_id = c.f_id
       WHERE c.sad_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching daily times:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


/**
 * POST: Create a new daily schedule
 * - Checks uniqueness across all schedule tables (daily, weekly, monthly)
 * - Prevents duplicates by ikimina_id
 * - Enforces ownership by sad_id
 */
router.post('/newSchedule', async (req, res) => {
  const userId = req.headers['x-sad-id'];
  const { ikimina_name, dtime_time, f_id, ikimina_id } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!ikimina_name || !dtime_time || !f_id || !ikimina_id) {
    return res.status(400).json({ message: 'Missing required fields: ikimina_name, dtime_time, f_id, or ikimina_id' });
  }

  try {
    // Verify ownership of category
    const [categoryRows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [f_id, userId]
    );
    if (categoryRows.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Check if this ikimina_id already exists in daily, weekly, or monthly
    const [daily] = await db.execute('SELECT 1 FROM ik_daily_time_info WHERE ikimina_id = ?', [ikimina_id]);
    const [weekly] = await db.execute('SELECT 1 FROM ik_weekly_time_info WHERE ikimina_id = ?', [ikimina_id]);
    const [monthly] = await db.execute('SELECT 1 FROM ik_monthly_time_info WHERE ikimina_id = ?', [ikimina_id]);

    if (daily.length > 0 || weekly.length > 0 || monthly.length > 0) {
      return res.status(409).json({
        message: 'This Ikimina already has a schedule in daily, weekly, or monthly.'
      });
    }

    // Optional: Also ensure no duplicate ikimina name in the same frequency
    const [existing] = await db.execute(
      'SELECT * FROM ik_daily_time_info WHERE ikimina_id = ? AND f_id = ?',
      [ikimina_id, f_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Ikimina already exists for this frequency category.' });
    }

    // Save new schedule
    await db.execute(
      'INSERT INTO ik_daily_time_info (ikimina_name, dtime_time, f_id, ikimina_id) VALUES (?, ?, ?, ?)',
      [ikimina_name, dtime_time, f_id, ikimina_id]
    );

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
    const [categoryRows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [f_id, userId]
    );
    if (categoryRows.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Confirm this daily record exists and belongs to the same category
    const [dailyTimeRows] = await db.execute(
      'SELECT * FROM ik_daily_time_info WHERE dtime_id = ? AND f_id = ?',
      [id, f_id]
    );
    if (dailyTimeRows.length === 0) {
      return res.status(404).json({ message: 'Daily time not found or unauthorized' });
    }

    // Prevent duplicate names for the same category
    if (ikimina_name) {
      const [existing] = await db.execute(
        'SELECT * FROM ik_daily_time_info WHERE ikimina_name = ? AND f_id = ? AND dtime_id != ?',
        [ikimina_name, f_id, id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: 'Ikimina name already exists for this frequency category' });
      }
    }

    // Update
    await db.execute(
      'UPDATE ik_daily_time_info SET ikimina_name = ?, dtime_time = ?, f_id = ? WHERE dtime_id = ?',
      [ikimina_name, dtime_time, f_id, id]
    );
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
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const [rows] = await db.execute(
      `SELECT d.dtime_id
       FROM ik_daily_time_info d
       JOIN frequency_category_info c ON d.f_id = c.f_id
       WHERE d.dtime_id = ? AND c.sad_id = ?`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Daily time not found or unauthorized' });
    }

    await db.execute('DELETE FROM ik_daily_time_info WHERE dtime_id = ?', [id]);
    res.status(200).json({ message: 'Daily time deleted successfully.' });
  } catch (error) {
    console.error('Error deleting daily time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});






// GET all schedules (daily, weekly, monthly) for logged-in user (sad_id)

router.get('/allSchedules', async (req, res) => {
  const userId = req.query.sad_id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: user ID missing' });
  }

  try {
    // Get user's sector location (sad_loc)
    const [userRows] = await db.execute(
      `SELECT sad_loc FROM supper_admin WHERE sad_id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userSector = userRows[0].sad_loc.toLowerCase();

    // DAILY schedules
    const [dailyRows] = await db.execute(
      `SELECT d.dtime_id AS id,
              d.ikimina_name,
              CONCAT('Every day at ', TIME_FORMAT(d.dtime_time, '%H:%i:%s')) AS schedule,
              l.cell,
              l.village,
              d.f_id,
              'daily' AS scheduleType
       FROM ik_daily_time_info d
       JOIN frequency_category_info c ON d.f_id = c.f_id
       JOIN ikimina_locations l ON d.ikimina_id = l.ikimina_id
       WHERE c.sad_id = ? AND LOWER(l.sector) = ?`,
      [userId, userSector]
    );

    // WEEKLY schedules
    const [weeklyRows] = await db.execute(
      `SELECT w.weeklytime_id AS id,
              w.ikimina_name,
              CONCAT('Every ', w.weeklytime_day, ' at ', TIME_FORMAT(w.weeklytime_time, '%H:%i:%s')) AS schedule,
              l.cell,
              l.village,
              w.f_id,
              'weekly' AS scheduleType
       FROM ik_weekly_time_info w
       JOIN frequency_category_info c ON w.f_id = c.f_id
       JOIN ikimina_locations l ON w.ikimina_id = l.ikimina_id
       WHERE c.sad_id = ? AND LOWER(l.sector) = ?`,
      [userId, userSector]
    );

    // MONTHLY schedules
    const [monthlyRows] = await db.execute(
      `SELECT m.monthlytime_id AS id,
              m.ikimina_name,
              CONCAT('Every ', CAST(m.monthlytime_date AS CHAR), ' at ', TIME_FORMAT(m.monthlytime_time, '%H:%i:%s')) AS schedule,
              l.cell,
              l.village,
              m.f_id,
              'monthly' AS scheduleType
       FROM ik_monthly_time_info m
       JOIN frequency_category_info c ON m.f_id = c.f_id
       JOIN ikimina_locations l ON m.ikimina_id = l.ikimina_id
       WHERE c.sad_id = ? AND LOWER(l.sector) = ?`,
      [userId, userSector]
    );

    const allSchedules = [...dailyRows, ...weeklyRows, ...monthlyRows];

    console.log('All schedules:', allSchedules); // debug log

    res.json(allSchedules);
  } catch (error) {
    console.error('Error fetching schedules:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});






module.exports = router;
