const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET all schedules (daily, weekly, monthly) for logged-in user (sad_id)
router.get('/allSchedules', async (req, res) => {
  const userId = req.headers['x-sad-id'];

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
              l.ikimina_name,
              CONCAT('Every day at ', TIME_FORMAT(d.dtime_time, '%H:%i:%s')) AS schedule,
              l.cell,
              l.village,
              d.f_id,
              'daily' AS scheduleType
       FROM ik_daily_time_info d
       JOIN frequency_category_info c ON d.f_id = c.f_id
       JOIN ikimina_locations l ON d.location_id = l.location_id
       WHERE c.sad_id = ? AND LOWER(l.sector) = ?`,
      [userId, userSector]
    );

    // WEEKLY schedules
    const [weeklyRows] = await db.execute(
      `SELECT w.weeklytime_id AS id,
              l.ikimina_name,
              CONCAT('Every ', w.weeklytime_day, ' at ', TIME_FORMAT(w.weeklytime_time, '%H:%i:%s')) AS schedule,
              l.cell,
              l.village,
              w.f_id,
              'weekly' AS scheduleType
       FROM ik_weekly_time_info w
       JOIN frequency_category_info c ON w.f_id = c.f_id
       JOIN ikimina_locations l ON w.location_id = l.location_id
       WHERE c.sad_id = ? AND LOWER(l.sector) = ?`,
      [userId, userSector]
    );

    // MONTHLY schedules
    const [monthlyRows] = await db.execute(
      `SELECT m.monthlytime_id AS id,
              l.ikimina_name,
              CONCAT('Every ', CAST(m.monthlytime_date AS CHAR), ' at ', TIME_FORMAT(m.monthlytime_time, '%H:%i:%s')) AS schedule,
              l.cell,
              l.village,
              m.f_id,
              'monthly' AS scheduleType
       FROM ik_monthly_time_info m
       JOIN frequency_category_info c ON m.f_id = c.f_id
       JOIN ikimina_locations l ON m.location_id = l.location_id
       WHERE c.sad_id = ? AND LOWER(l.sector) = ?`,
      [userId, userSector]
    );

    const allSchedules = [...dailyRows, ...weeklyRows, ...monthlyRows].sort((a, b) =>
      a.ikimina_name.localeCompare(b.ikimina_name)
    );

    console.log('All schedules:', allSchedules); // debug log

    res.json(allSchedules);
  } catch (error) {
    console.error('Error fetching schedules:', error.stack || error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// GET event times by frequency and ikimina_name
router.get('/eventTimes', async (req, res) => {
  const sadId = req.headers['x-sad-id'];
  const { frequency, ikimina_name } = req.query;

  if (!sadId) {
    return res.status(401).json({ message: 'Unauthorized: sadId missing' });
  }

  if (!frequency || !ikimina_name) {
    return res.status(400).json({ message: 'Both frequency and ikimina_name are required' });
  }

  try {
    let sql = '';
    let params = [];

    switch (frequency.toLowerCase()) {
      case 'daily':
        sql = `
          SELECT d.dtime_id AS id, d.dtime_time AS time, l.ikimina_name, d.f_id
          FROM ik_daily_time_info d
          JOIN ikimina_locations l ON d.location_id = l.location_id
          JOIN frequency_category_info c ON d.f_id = c.f_id
          WHERE l.ikimina_name = ? AND c.sad_id = ?`;
        params = [ikimina_name, sadId];
        break;

      case 'weekly':
        sql = `
          SELECT w.weeklytime_id AS id,
                 w.weeklytime_day AS day,
                 TIME_FORMAT(w.weeklytime_time, '%H:%i:%s') AS time,
                 l.ikimina_name, w.f_id
          FROM ik_weekly_time_info w
          JOIN ikimina_locations l ON w.location_id = l.location_id
          JOIN frequency_category_info c ON w.f_id = c.f_id
          WHERE l.ikimina_name = ? AND c.sad_id = ?`;
        params = [ikimina_name, sadId];
        break;

      case 'monthly':
        sql = `
          SELECT m.monthlytime_id AS id,
                 m.monthlytime_date AS day,
                 TIME_FORMAT(m.monthlytime_time, '%H:%i:%s') AS time,
                 l.ikimina_name, m.f_id
          FROM ik_monthly_time_info m
          JOIN ikimina_locations l ON m.location_id = l.location_id
          JOIN frequency_category_info c ON m.f_id = c.f_id
          WHERE l.ikimina_name = ? AND c.sad_id = ?`;
        params = [ikimina_name, sadId];
        break;

      default:
        return res.status(400).json({ message: 'Invalid frequency type' });
    }

    const [rows] = await db.execute(sql, params);

    const response = rows.map(r => ({
      id: r.id,
      ikimina_name: r.ikimina_name,
      f_id: r.f_id,
      day: r.day,
      time: r.time,
    }));

    res.json(response);

  } catch (error) {
    console.error('Error fetching event times:', error.stack || error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


module.exports = router;
