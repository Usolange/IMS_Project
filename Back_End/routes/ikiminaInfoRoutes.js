const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create Ikimina_info
router.post('/newIkimina', async (req, res) => {
  const {
    iki_name, iki_email, iki_username, iki_password,
    iki_location, f_id, dayOfEvent, timeOfEvent,
    numberOfEvents, sad_id
  } = req.body;

  if (
    !iki_name || !iki_email || !iki_username || !iki_password ||
    !f_id || !iki_location || !dayOfEvent || !sad_id ||
    typeof timeOfEvent === 'undefined' ||
    typeof numberOfEvents === 'undefined'
  ) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    console.log('Received create request with:', {
      iki_location,
      sad_id,
      iki_name,
      iki_email,
      iki_username,
      f_id,
      dayOfEvent,
      timeOfEvent,
      numberOfEvents,
    });

    // Validate ikimina location belongs to this user
   const [locationRows] = await db.query(
  `SELECT ikimina_name FROM ikimina_locations WHERE id = ? AND sad_id = ?`,
  [iki_location, sad_id]
);


    console.log('Location validation rows:', locationRows);

    if (locationRows.length === 0) {
      console.warn('Invalid Ikimina selection for user:', { iki_location, sad_id });
      return res.status(403).json({ message: 'Invalid Ikimina selection for this user.' });
    }

    // Check unique email and username
    const [existing] = await db.query(
      `SELECT * FROM Ikimina_info WHERE iki_email = ? OR iki_username = ?`,
      [iki_email, iki_username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email or Username already exists.' });
    }

    // ✅ Insert new Ikimina_info record WITH default penalty fields
    const sql = `
      INSERT INTO Ikimina_info (
        iki_name, iki_email, iki_username, iki_password,
        iki_location, f_id, dayOfEvent, timeOfEvent, numberOfEvents,
        penalty_time_delay, penalty_date_delay, saving_period_gap
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 60)
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
      numberOfEvents
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
    JOIN ikimina_locations l ON i.iki_location = l.id 
    JOIN frequency_category_info f ON l.f_id = f.f_id 
    WHERE
       l.sad_id = ?
    `, [sad_id]);

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

router.put('/update/:iki_id', authenticateSadId, async (req, res) => {
  const iki_id = req.params.iki_id;
  const sad_id = req.sad_id;
  const {
    iki_name,
    iki_email,
    iki_username,
    dayOfEvent,
    timeOfEvent,
    numberOfEvents
  } = req.body;

  if (!iki_name || !iki_email || !iki_username || !dayOfEvent || !timeOfEvent || !numberOfEvents) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check ownership before update
    const [rows] = await db.query(
      `SELECT i.iki_id
       FROM Ikimina_info i
       JOIN ikimina_locations l ON i.iki_location = l.ikimina_id
       WHERE i.iki_id = ? AND l.sad_id = ?`,
      [iki_id, sad_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found or not authorized to update' });
    }

    // Perform update
    const [result] = await db.query(
      `UPDATE Ikimina_info SET
         iki_name = ?,
         iki_email = ?,
         iki_username = ?,
         dayOfEvent = ?,
         timeOfEvent = ?,
         numberOfEvents = ?
       WHERE iki_id = ?`,
      [iki_name, iki_email, iki_username, dayOfEvent, timeOfEvent, numberOfEvents, iki_id]
    );

    res.json({ message: 'Ikimina updated successfully' });
  } catch (err) {
    console.error('Error updating Ikimina:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/delete/:iki_id', authenticateSadId, async (req, res) => {
  const iki_id = req.params.iki_id;
  const sad_id = req.sad_id;

  try {
    // Confirm the ikimina belongs to logged-in user
    const [rows] = await db.query(
      `SELECT i.iki_id
       FROM Ikimina_info i
       JOIN ikimina_locations l ON i.iki_location = l.ikimina_id
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
