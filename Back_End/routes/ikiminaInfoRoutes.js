const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware to extract sad_id from header and enforce auth
const authenticateSadId = (req, res, next) => {
  const sad_id = req.header('x-sad-id');
  if (!sad_id) {
    return res.status(401).json({ success: false, message: 'Unauthorized: sad_id missing' });
  }
  req.sad_id = sad_id;
  next();
};

// Create Ikimina_info (authenticated)
router.post('/newIkimina', authenticateSadId, async (req, res) => {
  const {
    iki_name, iki_email, iki_username, iki_password,
    iki_location, f_id, dayOfEvent, timeOfEvent,
    numberOfEvents
  } = req.body;

  const sad_id = req.sad_id; // from header, trusted

  if (
    !iki_name || !iki_email || !iki_username || !iki_password ||
    !f_id || !iki_location || !dayOfEvent ||
    typeof timeOfEvent === 'undefined' ||
    typeof numberOfEvents === 'undefined'
  ) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    // Validate location belongs to this admin
    const [locationRows] = await db.query(
      `SELECT ikimina_name FROM ikimina_locations WHERE ikimina_id = ? AND sad_id = ?`,
      [iki_location, sad_id]
    );
    if (locationRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Invalid Ikimina selection for this user.' });
    }

    // Check if location already used
    const [used] = await db.query(
      `SELECT iki_id FROM Ikimina_info WHERE iki_location = ?`,
      [iki_location]
    );
    if (used.length > 0) {
      return res.status(409).json({ success: false, message: 'This Ikimina location is already in use.' });
    }

    // Check unique email and username
    const [existing] = await db.query(
      `SELECT * FROM Ikimina_info WHERE iki_email = ? OR iki_username = ?`,
      [iki_email, iki_username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email or Username already exists.' });
    }

    // Insert new Ikimina_info
    const sql = `
      INSERT INTO Ikimina_info (
        iki_name, iki_email, iki_username, iki_password,
        iki_location, f_id, dayOfEvent, timeOfEvent, numberOfEvents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    res.status(201).json({ success: true, message: 'Ikimina account created successfully.' });
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// List all Ikimina_info for logged-in admin
router.get('/select', authenticateSadId, async (req, res) => {
  const sad_id = req.sad_id;

  try {
    const [rows] = await db.query(`
      SELECT i.*, l.cell, l.village, f.f_category AS category_name
      FROM Ikimina_info i
      JOIN ikimina_locations l ON i.iki_location = l.ikimina_id
      JOIN frequency_category_info f ON i.f_id = f.f_id
      WHERE l.sad_id = ?
    `, [sad_id]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching Ikimina:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get Ikimina by iki_id
router.get('/getById', authenticateSadId, async (req, res) => {
  const { iki_id } = req.query;
  const sad_id = req.sad_id;

  if (!iki_id) return res.status(400).json({ success: false, message: 'iki_id is required.' });

  try {
    // Verify ownership by sad_id
    const [rows] = await db.query(
      `SELECT i.iki_id, i.iki_name FROM Ikimina_info i
       JOIN ikimina_locations l ON i.iki_location = l.ikimina_id
       WHERE i.iki_id = ? AND l.sad_id = ?`,
      [iki_id, sad_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ikimina not found or not authorized' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching Ikimina:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Ikimina locations for admin NOT yet assigned
router.get('/selectAvailableIkimina', authenticateSadId, async (req, res) => {
  const sad_id = req.sad_id;

  try {
    const [rows] = await db.query(`
      SELECT l.ikimina_id, l.ikimina_name, l.cell, l.village, l.f_id
      FROM ikimina_locations l
      LEFT JOIN Ikimina_info i ON i.iki_location = l.ikimina_id
      WHERE l.sad_id = ? AND i.iki_location IS NULL
    `, [sad_id]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching available Ikimina:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update Ikimina info by iki_id
router.put('/update/:iki_id', authenticateSadId, async (req, res) => {
  const iki_id = req.params.iki_id;
  const sad_id = req.sad_id;
  const {
    iki_name, iki_email, iki_username,
    dayOfEvent, timeOfEvent, numberOfEvents
  } = req.body;

  if (!iki_name || !iki_email || !iki_username || !dayOfEvent || !timeOfEvent || !numberOfEvents) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Check if this Ikimina belongs to logged-in admin
    const [rows] = await db.query(
      `SELECT i.iki_id FROM Ikimina_info i
       JOIN ikimina_locations l ON i.iki_location = l.ikimina_id
       WHERE i.iki_id = ? AND l.sad_id = ?`,
      [iki_id, sad_id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Ikimina not found or not authorized' });
    }

    // Update
    await db.query(`
      UPDATE Ikimina_info SET
        iki_name = ?, iki_email = ?, iki_username = ?,
        dayOfEvent = ?, timeOfEvent = ?, numberOfEvents = ?
      WHERE iki_id = ?`,
      [iki_name, iki_email, iki_username, dayOfEvent, timeOfEvent, numberOfEvents, iki_id]
    );

    res.json({ success: true, message: 'Ikimina updated successfully' });
  } catch (err) {
    console.error('Error updating Ikimina:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete Ikimina info by iki_id
router.delete('/delete/:iki_id', authenticateSadId, async (req, res) => {
  const iki_id = req.params.iki_id;
  const sad_id = req.sad_id;

  try {
    // Verify ownership
    const [rows] = await db.query(
      `SELECT i.iki_id FROM Ikimina_info i
       JOIN ikimina_locations l ON i.iki_location = l.ikimina_id
       WHERE i.iki_id = ? AND l.sad_id = ?`,
      [iki_id, sad_id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Ikimina not found or not authorized' });
    }

    // Delete
    await db.query('DELETE FROM Ikimina_info WHERE iki_id = ?', [iki_id]);

    res.json({ success: true, message: 'Ikimina deleted successfully' });
  } catch (err) {
    console.error('Error deleting Ikimina:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
