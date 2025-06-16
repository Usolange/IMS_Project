const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create Ikimina_info
router.post('/create', async (req, res) => {
  const {
    iki_name, iki_email, iki_username, iki_password,
    f_id, iki_location, dayOfEvent, sad_id
  } = req.body;

  if (
    !iki_name || !iki_email || !iki_username || !iki_password ||
    !f_id || !iki_location || !dayOfEvent || !sad_id
  ) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Check if Ikimina name exists and belongs to the logged-in admin
    const [locationRows] = await db.query(
      `SELECT ikimina_name FROM ikimina_locations WHERE ikimina_name = ? AND ikimina_id = ? AND sad_id = ?`,
      [iki_name, iki_location, sad_id]
    );

    if (locationRows.length === 0) {
      return res.status(403).json({ message: 'Invalid Ikimina selection for this user.' });
    }

    // Check for unique email or username
    const [existing] = await db.query(
      `SELECT * FROM Ikimina_info WHERE iki_email = ? OR iki_username = ?`,
      [iki_email, iki_username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email or Username already exists.' });
    }

    const sql = `
      INSERT INTO Ikimina_info (
        iki_name, iki_email, iki_username, iki_password,
        f_id, iki_location, dayOfEven
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      iki_name,
      iki_email,
      iki_username,
      iki_password, // Password not hashed (as requested)
      f_id,
      iki_location,
      dayOfEvent
    ]);

    res.status(201).json({ message: 'Ikimina account created successfully.' });
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// List all Ikimina_info created by a specific admin
router.get('/list', async (req, res) => {
  const sad_id = req.query.sad_id;

  if (!sad_id) {
    return res.status(400).json({ message: 'Admin ID required' });
  }

  try {
    const [data] = await db.query(
      `SELECT i.*, l.cell, l.sector, l.village, f.f_category 
       FROM Ikimina_info i
       JOIN ikimina_locations l ON i.iki_location = l.ikimina_id
       JOIN frequency_category_info f ON i.f_id = f.f_id
       WHERE l.sad_id = ?`,
      [sad_id]
    );

    res.json(data);
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update and Delete routes can be added later if needed

module.exports = router;
