const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');

// Helper to run parameterized queries with mssql
async function runQuery(query, params = []) {
  await poolConnect;
  const request = pool.request();
  params.forEach(({ name, type, value }) => {
    request.input(name, type, value);
  });
  const result = await request.query(query);
  return result.recordset;
}

// GET all schedules (daily, weekly, monthly) for logged-in user (sad_id)
router.get('/allSchedules', async (req, res) => {
  const userId = req.headers['x-sad-id'];

  if (!userId) {
    console.log('[allSchedules] Missing x-sad-id header');
    return res.status(401).json({ message: 'Unauthorized: user ID missing' });
  }

  try {
    console.log(`[allSchedules] Fetching sector for user ${userId}`);

    // Get user sector
    const sectorQuery = `SELECT sad_loc FROM supper_admin WHERE sad_id = @userId`;
    const userRows = await runQuery(sectorQuery, [
      { name: 'userId', type: sql.Int, value: parseInt(userId) }
    ]);

    if (userRows.length === 0) {
      console.log(`[allSchedules] No user found for sad_id: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const userSector = userRows[0].sad_loc.toLowerCase();
    console.log(`[allSchedules] User sector: ${userSector}`);

    // DAILY schedules
    console.log(`[allSchedules] Fetching daily schedules...`);
    const dailyQuery = `
      SELECT d.dtime_id AS id,
             l.ikimina_name,
             'Every day at ' + ISNULL(FORMAT(CAST(d.dtime_time AS datetime2), 'hh:mm tt'), 'N/A') AS schedule,
             l.cell,
             l.village,
             d.f_id,
             'daily' AS scheduleType
      FROM ik_daily_time_info d
      JOIN frequency_category_info c ON d.f_id = c.f_id
      JOIN ikimina_locations l ON d.location_id = l.location_id
      WHERE c.sad_id = @userId AND LOWER(l.sector) = @userSector
    `;
    const dailyRows = await runQuery(dailyQuery, [
      { name: 'userId', type: sql.Int, value: parseInt(userId) },
      { name: 'userSector', type: sql.VarChar, value: userSector }
    ]);
    console.log('[allSchedules] Daily schedules full data:', JSON.stringify(dailyRows, null, 2));

    // WEEKLY schedules
    console.log(`[allSchedules] Fetching weekly schedules...`);
    const weeklyQuery = `
      SELECT w.weeklytime_id AS id,
             l.ikimina_name,
             'Every ' + w.weeklytime_day + ' at ' + ISNULL(FORMAT(CAST(w.weeklytime_time AS datetime2), 'hh:mm tt'), 'N/A') AS schedule,
             l.cell,
             l.village,
             w.f_id,
             'weekly' AS scheduleType
      FROM ik_weekly_time_info w
      JOIN frequency_category_info c ON w.f_id = c.f_id
      JOIN ikimina_locations l ON w.location_id = l.location_id
      WHERE c.sad_id = @userId AND LOWER(l.sector) = @userSector
    `;
    const weeklyRows = await runQuery(weeklyQuery, [
      { name: 'userId', type: sql.Int, value: parseInt(userId) },
      { name: 'userSector', type: sql.VarChar, value: userSector }
    ]);
    console.log('[allSchedules] Weekly schedules full data:', JSON.stringify(weeklyRows, null, 2));

    // MONTHLY schedules
    console.log(`[allSchedules] Fetching monthly schedules...`);
    const monthlyQuery = `
      SELECT m.monthlytime_id AS id,
             l.ikimina_name,
             'Every ' + CAST(m.monthlytime_date AS VARCHAR) + ' at ' + ISNULL(FORMAT(CAST(m.monthlytime_time AS datetime2), 'hh:mm tt'), 'N/A') AS schedule,
             l.cell,
             l.village,
             m.f_id,
             'monthly' AS scheduleType
      FROM ik_monthly_time_info m
      JOIN frequency_category_info c ON m.f_id = c.f_id
      JOIN ikimina_locations l ON m.location_id = l.location_id
      WHERE c.sad_id = @userId AND LOWER(l.sector) = @userSector
    `;
    const monthlyRows = await runQuery(monthlyQuery, [
      { name: 'userId', type: sql.Int, value: parseInt(userId) },
      { name: 'userSector', type: sql.VarChar, value: userSector }
    ]);
    console.log('[allSchedules] Monthly schedules full data:', JSON.stringify(monthlyRows, null, 2));

    // Combine and sort all schedules
    const allSchedules = [...dailyRows, ...weeklyRows, ...monthlyRows].sort((a, b) =>
      a.ikimina_name.localeCompare(b.ikimina_name)
    );

    console.log('[allSchedules] Combined all schedules full data:', JSON.stringify(allSchedules, null, 2));

    return res.json(allSchedules);

  } catch (error) {
    console.error('[allSchedules] Error:', error.stack || error.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET event times by frequency and ikimina_name
router.get('/eventTimes', async (req, res) => {
  const sadId = req.headers['x-sad-id'];
  const { frequency, ikimina_name } = req.query;

  if (!sadId) {
    console.log('[eventTimes] Missing x-sad-id header');
    return res.status(401).json({ message: 'Unauthorized: sadId missing' });
  }

  if (!frequency || !ikimina_name) {
    console.log('[eventTimes] Missing frequency or ikimina_name query');
    return res.status(400).json({ message: 'Both frequency and ikimina_name are required' });
  }

  try {
    let sqlQuery = '';
    const params = [
      { name: 'ikimina_name', type: sql.VarChar, value: ikimina_name },
      { name: 'sadId', type: sql.Int, value: parseInt(sadId) }
    ];

    switch (frequency.toLowerCase()) {
      case 'daily':
        sqlQuery = `
          SELECT d.dtime_id AS id,
                 FORMAT(CAST(d.dtime_time AS datetime2), 'hh:mm tt') AS time,
                 l.ikimina_name,
                 d.f_id
          FROM ik_daily_time_info d
          JOIN ikimina_locations l ON d.location_id = l.location_id
          JOIN frequency_category_info c ON d.f_id = c.f_id
          WHERE l.ikimina_name = @ikimina_name AND c.sad_id = @sadId
        `;
        break;

      case 'weekly':
        sqlQuery = `
          SELECT w.weeklytime_id AS id,
                 w.weeklytime_day AS day,
                 FORMAT(CAST(w.weeklytime_time AS datetime2), 'hh:mm tt') AS time,
                 l.ikimina_name,
                 w.f_id
          FROM ik_weekly_time_info w
          JOIN ikimina_locations l ON w.location_id = l.location_id
          JOIN frequency_category_info c ON w.f_id = c.f_id
          WHERE l.ikimina_name = @ikimina_name AND c.sad_id = @sadId
        `;
        break;

      case 'monthly':
        sqlQuery = `
          SELECT m.monthlytime_id AS id,
                 m.monthlytime_date AS day,
                 FORMAT(CAST(m.monthlytime_time AS datetime2), 'hh:mm tt') AS time,
                 l.ikimina_name,
                 m.f_id
          FROM ik_monthly_time_info m
          JOIN ikimina_locations l ON m.location_id = l.location_id
          JOIN frequency_category_info c ON m.f_id = c.f_id
          WHERE l.ikimina_name = @ikimina_name AND c.sad_id = @sadId
        `;
        break;

      default:
        console.log(`[eventTimes] Invalid frequency: ${frequency}`);
        return res.status(400).json({ message: 'Invalid frequency. Must be daily, weekly, or monthly.' });
    }

    const rows = await runQuery(sqlQuery, params);
    console.log(`[eventTimes] Full data fetched for ikimina_name=${ikimina_name}, frequency=${frequency}:`, JSON.stringify(rows, null, 2));

    const formatted = rows.map(row => ({
      id: row.id,
      ikimina_name: row.ikimina_name,
      f_id: row.f_id,
      day: row.day || null,
      time: row.time
    }));

    return res.json(formatted);

  } catch (error) {
    console.error('[eventTimes] Error:', error.stack || error.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
