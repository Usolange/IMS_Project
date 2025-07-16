const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create Ikimina_info
router.post('/newIkimina', async (req, res) => {
  const {
    iki_name, iki_email, iki_username, iki_password,
    iki_location, f_id, dayOfEvent, timeOfEvent,
    numberOfEvents, sad_id, weekly_saving_days, monthly_saving_days
  } = req.body;

  const requiredFields = [];
  if (!iki_name) requiredFields.push('Ikimina Name');
  if (!iki_email) requiredFields.push('Ikimina Email');
  if (!iki_username) requiredFields.push('Ikimina Username');
  if (!iki_password) requiredFields.push('Ikimina Password');
  if (!f_id) requiredFields.push('Frequency Category');
  if (!iki_location) requiredFields.push('Ikimina Location');
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
    const [locationRows] = await db.query(
      `SELECT ikimina_name FROM ikimina_locations WHERE location_id = ? AND sad_id = ?`,
      [iki_location, sad_id]
    );

    if (locationRows.length === 0) {
      return res.status(403).json({ message: 'You are not authorized to assign this Ikimina location.' });
    }

    const [catRows] = await db.query(
      `SELECT f_category FROM frequency_category_info WHERE f_id = ? AND sad_id = ?`,
      [f_id, sad_id]
    );

    if (catRows.length === 0) {
      return res.status(400).json({ message: 'The selected frequency category is invalid or not owned by you.' });
    }

    const freqCategory = catRows[0].f_category?.trim().toLowerCase();

    if (!['daily', 'weekly', 'monthly'].includes(freqCategory)) {
      return res.status(400).json({ message: 'Frequency category must be Daily, Weekly, or Monthly.' });
    }

    const [existing] = await db.query(
      `SELECT * FROM Ikimina_info 
       WHERE iki_email = ? 
         OR iki_username = ? 
         OR iki_location = ?`,
      [iki_email, iki_username, iki_location]
    );

    if (existing.length > 0) {
      const duplicateFields = [];
      existing.forEach(row => {
        if (row.iki_email === iki_email) duplicateFields.push('Email');
        if (row.iki_username === iki_username) duplicateFields.push('Username');
        if (row.iki_location === iki_location) duplicateFields.push('Location');
      });

      return res.status(409).json({
        message: `Duplicate found: ${[...new Set(duplicateFields)].join(', ')} already in use.`
      });
    }

    let weeklySavingDaysJson = null;
    let monthlySavingDaysJson = null;

    if (freqCategory === 'daily') {
      weeklySavingDaysJson = null;
      monthlySavingDaysJson = null;
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

    const sql = `
      INSERT INTO Ikimina_info (
        iki_name, iki_email, iki_username, iki_password,
        iki_location, f_id, dayOfEvent, timeOfEvent, numberOfEvents,
        weekly_saving_days, monthly_saving_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      iki_name,
      iki_email,
      iki_username,
      iki_password,
      iki_location,
      f_id,
      dayOfEvent,
      timeOfEvent,
      numberOfEvents,
      weeklySavingDaysJson,
      monthlySavingDaysJson
    ]);

    res.status(201).json({ message: 'Ikimina was created successfully.' });
  } catch (err) {
    console.error('Database error while creating Ikimina:', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'One or more fields must be unique and already exist in the system.' });
    }
    res.status(500).json({ message: 'Something went wrong while saving Ikimina. Please try again.' });
  }
});

// List all Ikimina_info created by a specific admin
router.get('/select', async (req, res) => {
  const sad_id = req.query.sad_id;
  if (!sad_id) {
    return res.status(400).json({ message: 'Admin ID (sad_id) is required' });
  }

  try {
    const [rows] = await db.query(`
    SELECT i.*, l.cell, l.village, 
    f.f_category AS category_name FROM Ikimina_info i 
    JOIN ikimina_locations l ON i.iki_location = l.location_id	
    JOIN frequency_category_info f ON l.f_id = f.f_id 
    WHERE l.sad_id = ?`, [sad_id]);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching Ikimina by user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper
const authenticateSadId = (req, res, next) => {
  const sad_id = req.header('x-sad-id');
  if (!sad_id) {
    return res.status(401).json({ message: 'Unauthorized: Admin ID (sad_id) is missing.' });
  }
  req.sad_id = sad_id;
  next();
};

// UPDATE Ikimina_info
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

  if (!weekly_saving_days && !monthly_saving_days) {
    return res.status(400).json({ message: 'Either weekly saving days or monthly saving days must be provided.' });
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
    const [rows] = await db.query(
      `SELECT i.iki_id
       FROM Ikimina_info i
       JOIN ikimina_locations l ON i.iki_location = l.location_id
       WHERE i.iki_id = ? AND l.sad_id = ?`,
      [iki_id, sad_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found or not authorized to update.' });
    }

    await db.query(
      `UPDATE Ikimina_info SET
         iki_name = ?,
         iki_email = ?,
         iki_username = ?,
         dayOfEvent = ?,
         timeOfEvent = ?,
         numberOfEvents = ?,
         weekly_saving_days = ?,
         monthly_saving_days = ?
       WHERE iki_id = ?`,
      [
        iki_name,
        iki_email,
        iki_username,
        dayOfEvent,
        timeOfEvent,
        numberOfEvents,
        weeklySavingDaysJson,
        monthlySavingDaysJson,
        iki_id
      ]
    );

    res.json({ message: 'Ikimina was updated successfully.' });
  } catch (err) {
    console.error('Error updating Ikimina:', err);
    res.status(500).json({ message: 'Something went wrong during update. Please try again later.' });
  }
});

// DELETE Ikimina_info
router.delete('/delete/:iki_id', authenticateSadId, async (req, res) => {
  const iki_id = req.params.iki_id;
  const sad_id = req.sad_id;

  try {
    const [rows] = await db.query(
      `SELECT i.iki_id
       FROM Ikimina_info i
       JOIN ikimina_locations l ON i.iki_location = l.location_id
       WHERE i.iki_id = ? AND l.sad_id = ?`,
      [iki_id, sad_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found or not authorized to delete.' });
    }

    await db.query('DELETE FROM Ikimina_info WHERE iki_id = ?', [iki_id]);

    res.json({ message: 'Ikimina was deleted successfully.' });
  } catch (err) {
    console.error('Error deleting Ikimina:', err);
    res.status(500).json({ message: 'Something went wrong during deletion. Please try again later.' });
  }
});

module.exports = router;
