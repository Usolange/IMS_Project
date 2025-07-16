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
  if (!iki_name) requiredFields.push('iki_name');
  if (!iki_email) requiredFields.push('iki_email');
  if (!iki_username) requiredFields.push('iki_username');
  if (!iki_password) requiredFields.push('iki_password');
  if (!f_id) requiredFields.push('f_id');
  if (!iki_location) requiredFields.push('iki_location');
  if (!dayOfEvent) requiredFields.push('dayOfEvent');
  if (!timeOfEvent) requiredFields.push('timeOfEvent');
  if (!numberOfEvents) requiredFields.push('numberOfEvents');
  if (!sad_id) requiredFields.push('sad_id');

  let freqCategory = '';
  if (f_id === 1 || f_id === '1') freqCategory = 'daily';
  else if (f_id === 2 || f_id === '2') freqCategory = 'weekly';
  else if (f_id === 3 || f_id === '3') freqCategory = 'monthly';

  if (requiredFields.length > 0) {
    return res.status(400).json({ message: `Missing required fields: ${requiredFields.join(', ')}` });
  }

  // Validation to ensure at least one of weekly_saving_days or monthly_saving_days is provided
  if (!weekly_saving_days && !monthly_saving_days) {
    return res.status(400).json({ message: 'Either weekly saving days or monthly saving days must be provided.' });
  }

  let weeklySavingDaysJson = null;
  let monthlySavingDaysJson = null;

  if (freqCategory === 'weekly') {
    if (!Array.isArray(weekly_saving_days) || weekly_saving_days.length === 0) {
      return res.status(400).json({ message: 'Weekly saving days are required for weekly frequency.' });
    }
    weeklySavingDaysJson = JSON.stringify(weekly_saving_days);
  }

  if (freqCategory === 'monthly') {
    if (!Array.isArray(monthly_saving_days) || monthly_saving_days.length === 0) {
      return res.status(400).json({ message: 'Monthly saving days are required for monthly frequency.' });
    }
    monthlySavingDaysJson = JSON.stringify(monthly_saving_days);
  }

  try {
    const [locationRows] = await db.query(
      `SELECT ikimina_name FROM ikimina_locations WHERE location_id = ? AND sad_id = ?`,
      [iki_location, sad_id]
    );

    if (locationRows.length === 0) {
      console.warn('Invalid Ikimina selection for user:', { iki_location, sad_id });
      return res.status(403).json({ message: 'Invalid Ikimina selection for this user.' });
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
    if (row.iki_email === iki_email) duplicateFields.push('email');
    if (row.iki_username === iki_username) duplicateFields.push('username');
    if (row.iki_location === iki_location) duplicateFields.push('location');
  });

  return res.status(409).json({
    message: `Duplicate found: ${[...new Set(duplicateFields)].join(', ')} already in use.`
  });
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

    res.status(201).json({ message: 'Ikimina account created successfully.' });
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).json({ message: 'Internal server error.' });
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

const authenticateSadId = (req, res, next) => {
  const sad_id = req.header('x-sad-id');
  if (!sad_id) {
    return res.status(401).json({ message: 'Unauthorized: sad_id missing' });
  }
  req.sad_id = sad_id;
  next();
};

// Update Ikimina_info
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

  // Check if required fields are provided
  if (!iki_name || !iki_email || !iki_username || !dayOfEvent || !timeOfEvent || !numberOfEvents) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Ensure that either weekly_saving_days or monthly_saving_days is provided
  if (!weekly_saving_days && !monthly_saving_days) {
    return res.status(400).json({ message: 'Either weekly saving days or monthly saving days must be provided.' });
  }

  // Process weekly_saving_days and monthly_saving_days as JSON strings
  let weeklySavingDaysJson = null;
  let monthlySavingDaysJson = null;

  if (weekly_saving_days && Array.isArray(weekly_saving_days) && weekly_saving_days.length > 0) {
    weeklySavingDaysJson = JSON.stringify(weekly_saving_days);
  }

  if (monthly_saving_days && Array.isArray(monthly_saving_days) && monthly_saving_days.length > 0) {
    monthlySavingDaysJson = JSON.stringify(monthly_saving_days);
  }

  try {
    // Check if Ikimina exists and belongs to the logged-in admin
    const [rows] = await db.query(
      `SELECT i.iki_id
       FROM Ikimina_info i
       JOIN ikimina_locations l ON i.iki_location = l.location_id
       WHERE i.iki_id = ? AND l.sad_id = ?`,
      [iki_id, sad_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found or not authorized to update' });
    }

    // Update Ikimina_info record
    const [result] = await db.query(
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
      [iki_name, iki_email, iki_username, dayOfEvent, timeOfEvent, numberOfEvents, 
        weeklySavingDaysJson, monthlySavingDaysJson, iki_id]
    );

    // Respond with success
    res.json({ message: 'Ikimina updated successfully' });
  } catch (err) {
    console.error('Error updating Ikimina:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete Ikimina_info
router.delete('/delete/:iki_id', authenticateSadId, async (req, res) => {
  const iki_id = req.params.iki_id;
  const sad_id = req.sad_id;

  try {
    // Confirm the ikimina belongs to logged-in user
    const [rows] = await db.query(
      `SELECT i.iki_id
       FROM Ikimina_info i
       JOIN ikimina_locations l ON i.iki_location = l.location_id
       WHERE i.iki_id = ? AND l.sad_id = ?`,
      [iki_id, sad_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found or not authorized to delete' });
    }

    // Proceed to delete
    await db.query('DELETE FROM Ikimina_info WHERE iki_id = ?', [iki_id]);

    res.json({ message: 'Ikimina deleted successfully' });
  } catch (err) {
    console.error('Error deleting Ikimina:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
