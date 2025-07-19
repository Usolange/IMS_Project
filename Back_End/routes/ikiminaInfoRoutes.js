const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');

// Helper async function to run query with inputs and return recordset
async function queryDB(query, inputs = {}) {
  await poolConnect;
  const request = pool.request();
  for (const [key, value] of Object.entries(inputs)) {
    request.input(key, value);
  }
  const result = await request.query(query);
  return result.recordset;
}

// Middleware to check x-sad-id header for protected routes
const authenticateSadId = (req, res, next) => {
  const sad_id = req.header('x-sad-id');
  if (!sad_id) {
    return res.status(401).json({ message: 'Unauthorized: Admin ID (sad_id) is missing.' });
  }
  req.sad_id = sad_id;
  next();
};


async function runQuery(query, params = []) {
  await poolConnect;
  const request = pool.request();
  params.forEach(({ name, type, value }) => {
    request.input(name, type, value);
  });
  const result = await request.query(query);
  return result.recordset;
}

// GET all Ikimina_info created by the current admin (with proper time formatting)
router.get('/select', async (req, res) => {
  const sad_id = req.query.sad_id;

  if (!sad_id) {
    return res.status(400).json({ message: 'Admin ID (sad_id) is required' });
  }

  try {
    await poolConnect;
    const request = pool.request();
    request.input('sad_id', sql.Int, sad_id);

    const result = await request.query(`
      SELECT 
        i.iki_id,
        i.iki_name,
        i.iki_email,
        i.iki_username,
        i.iki_password,
        i.location_id,
        i.f_id,
        i.dayOfEvent,
        CONVERT(VARCHAR(5), i.timeOfEvent, 108) AS timeOfEvent,  -- returns "HH:mm"
        i.numberOfEvents,
        i.weekly_saving_days,
        i.monthly_saving_days,
        i.created_at,
        l.cell,
        l.village,
        f.f_category AS category_name
      FROM Ikimina_info i
      INNER JOIN ikimina_locations l ON i.location_id = l.location_id
      INNER JOIN frequency_category_info f ON i.f_id = f.f_id
      WHERE l.sad_id = @sad_id
    `);

    console.log('Fetched Ikimina_info (formatted):', result.recordset);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching Ikimina_info by sad_id:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// CREATE new Ikimina
router.post('/newIkimina', async (req, res) => {
  const {
    iki_name, iki_email, iki_username, iki_password,
    location_id, f_id, dayOfEvent, timeOfEvent,
    numberOfEvents, sad_id, weekly_saving_days, monthly_saving_days
  } = req.body;

  const requiredFields = [];
  if (!iki_name) requiredFields.push('Ikimina Name');
  if (!iki_email) requiredFields.push('Ikimina Email');
  if (!iki_username) requiredFields.push('Ikimina Username');
  if (!iki_password) requiredFields.push('Ikimina Password');
  if (!f_id) requiredFields.push('Frequency Category');
  if (!location_id) requiredFields.push('Ikimina Location');
  if (!dayOfEvent) requiredFields.push('Day of Event');
  if (!timeOfEvent) requiredFields.push('Time of Event');
  if (!numberOfEvents) requiredFields.push('Number of Events');
  if (!sad_id) requiredFields.push('Admin ID');

  if (requiredFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${requiredFields.join(', ')}`
    });
  }

  try {
    // Check location ownership
    const locationRows = await queryDB(
      `SELECT ikimina_name FROM ikimina_locations WHERE location_id = @location_id AND sad_id = @sad_id`,
      { location_id, sad_id }
    );

    if (locationRows.length === 0) {
      return res.status(403).json({ message: 'You are not authorized to assign this Ikimina location.' });
    }

    // Check frequency category ownership
    const catRows = await queryDB(
      `SELECT f_category FROM frequency_category_info WHERE f_id = @f_id AND sad_id = @sad_id`,
      { f_id, sad_id }
    );

    if (catRows.length === 0) {
      return res.status(400).json({ message: 'Selected frequency category is invalid or not owned by you.' });
    }

    const freqCategory = catRows[0].f_category?.trim().toLowerCase();

    if (!['daily', 'weekly', 'monthly'].includes(freqCategory)) {
      return res.status(400).json({ message: 'Frequency category must be Daily, Weekly, or Monthly.' });
    }

    // Check duplicates by email, username or location
    const existing = await queryDB(
      `SELECT * FROM Ikimina_info WHERE iki_email = @iki_email OR iki_username = @iki_username OR location_id = @location_id`,
      { iki_email, iki_username, location_id }
    );

    if (existing.length > 0) {
      const duplicateFields = [];
      existing.forEach(row => {
        if (row.iki_email === iki_email) duplicateFields.push('Email');
        if (row.iki_username === iki_username) duplicateFields.push('Username');
        if (row.location_id === location_id) duplicateFields.push('Location');
      });

      return res.status(409).json({
        message: `Duplicate found: ${[...new Set(duplicateFields)].join(', ')} already in use.`
      });
    }

    let weeklySavingDaysJson = null;
    let monthlySavingDaysJson = null;

    if (freqCategory === 'daily') {
      // no saving days needed
    } else if (freqCategory === 'weekly') {
      if (!Array.isArray(weekly_saving_days) || weekly_saving_days.length === 0) {
        return res.status(400).json({ message: 'You must provide valid weekly saving days.' });
      }
      weeklySavingDaysJson = JSON.stringify(weekly_saving_days);
    } else if (freqCategory === 'monthly') {
      if (!Array.isArray(monthly_saving_days) || monthly_saving_days.length === 0) {
        return res.status(400).json({ message: 'You must provide valid monthly saving days.' });
      }
      monthlySavingDaysJson = JSON.stringify(monthly_saving_days);
    }

    // Insert new Ikimina_info
    const insertSql = `
      INSERT INTO Ikimina_info (
        iki_name, iki_email, iki_username, iki_password,
        location_id, f_id, dayOfEvent, timeOfEvent, numberOfEvents,
        weekly_saving_days, monthly_saving_days
      ) VALUES (
        @iki_name, @iki_email, @iki_username, @iki_password,
        @location_id, @f_id, @dayOfEvent, @timeOfEvent, @numberOfEvents,
        @weekly_saving_days, @monthly_saving_days
      )
    `;

    await pool.request()
      .input('iki_name', iki_name)
      .input('iki_email', iki_email)
      .input('iki_username', iki_username)
      .input('iki_password', iki_password)
      .input('location_id', location_id)
      .input('f_id', f_id)
      .input('dayOfEvent', dayOfEvent)
      .input('timeOfEvent', timeOfEvent)
      .input('numberOfEvents', numberOfEvents)
      .input('weekly_saving_days', weeklySavingDaysJson)
      .input('monthly_saving_days', monthlySavingDaysJson)
      .query(insertSql);

    res.status(201).json({ message: 'Ikimina was created successfully.' });
  } catch (err) {
    console.error('Database error while creating Ikimina:', err);
    if (err?.number === 2627) {
      return res.status(409).json({ message: 'One or more fields must be unique and already exist in the system.' });
    }
    res.status(500).json({ message: 'Something went wrong while saving Ikimina. Please try again.' });
  }
});


// UPDATE Ikimina
router.put('/update/:iki_id', authenticateSadId, async (req, res) => {
  const iki_id = req.params.iki_id;
  const sad_id = req.sad_id;
  const {
    iki_name,
    iki_email,
    iki_username,
    dayOfEvent,
    timeOfEvent,
    numberOfEvents,
    weekly_saving_days,
    monthly_saving_days
  } = req.body;

  const missingFields = [];
  if (!iki_name) missingFields.push('Ikimina Name');
  if (!iki_email) missingFields.push('Ikimina Email');
  if (!iki_username) missingFields.push('Ikimina Username');
  if (!dayOfEvent) missingFields.push('Day of Event');
  if (!timeOfEvent) missingFields.push('Time of Event');
  if (!numberOfEvents) missingFields.push('Number of Events');

  if (missingFields.length > 0) {
    return res.status(400).json({ message: `Missing fields: ${missingFields.join(', ')}` });
  }

  let weeklySavingDaysJson = null;
  let monthlySavingDaysJson = null;

  if (Array.isArray(weekly_saving_days) && weekly_saving_days.length > 0) {
    weeklySavingDaysJson = JSON.stringify(weekly_saving_days);
  }

  if (Array.isArray(monthly_saving_days) && monthly_saving_days.length > 0) {
    monthlySavingDaysJson = JSON.stringify(monthly_saving_days);
  }

  try {
    const ownershipRows = await queryDB(
      `SELECT i.iki_id
       FROM Ikimina_info i
       JOIN ikimina_locations l ON i.location_id = l.location_id
       WHERE i.iki_id = @iki_id AND l.sad_id = @sad_id`,
      { iki_id, sad_id }
    );

    if (ownershipRows.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found or not authorized to update.' });
    }

    const updateSql = `
      UPDATE Ikimina_info SET
         iki_name = @iki_name,
         iki_email = @iki_email,
         iki_username = @iki_username,
         dayOfEvent = @dayOfEvent,
         timeOfEvent = @timeOfEvent,
         numberOfEvents = @numberOfEvents,
         weekly_saving_days = @weekly_saving_days,
         monthly_saving_days = @monthly_saving_days
      WHERE iki_id = @iki_id
    `;

    await pool.request()
      .input('iki_name', iki_name)
      .input('iki_email', iki_email)
      .input('iki_username', iki_username)
      .input('dayOfEvent', dayOfEvent)
      .input('timeOfEvent', timeOfEvent)
      .input('numberOfEvents', numberOfEvents)
      .input('weekly_saving_days', weeklySavingDaysJson)
      .input('monthly_saving_days', monthlySavingDaysJson)
      .input('iki_id', iki_id)
      .query(updateSql);

    res.json({ message: 'Ikimina was updated successfully.' });
  } catch (err) {
    console.error('Error updating Ikimina:', err);
    res.status(500).json({ message: 'Something went wrong during update. Please try again later.' });
  }
});

// DELETE Ikimina
router.delete('/delete/:iki_id', authenticateSadId, async (req, res) => {
  const iki_id = req.params.iki_id;
  const sad_id = req.sad_id;

  try {
    const ownershipRows = await queryDB(
      `SELECT i.iki_id
       FROM Ikimina_info i
       JOIN ikimina_locations l ON i.location_id = l.location_id
       WHERE i.iki_id = @iki_id AND l.sad_id = @sad_id`,
      { iki_id, sad_id }
    );

    if (ownershipRows.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found or not authorized to delete.' });
    }

    await pool.request()
      .input('iki_id', iki_id)
      .query('DELETE FROM Ikimina_info WHERE iki_id = @iki_id');

    res.json({ message: 'Ikimina was deleted successfully.' });
  } catch (err) {
    console.error('Error deleting Ikimina:', err);
    res.status(500).json({ message: 'Something went wrong during deletion. Please try again later.' });
  }
});

module.exports = router;
