// routes/LocationManagerRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/create', async (req, res) => {
  const { ikiminaName, province, district, sector, cell, village, sad_id } = req.body;

  if (!ikiminaName || !province || !district || !sector || !cell || !village || !sad_id) {
    return res.status(400).json({ message: 'All fields including user ID are required.' });
  }

  try {
    // 1. Get user's sector from database
    const [userRows] = await db.query('SELECT sad_loc FROM supper_admin WHERE sad_id = ?', [sad_id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const userSector = userRows[0].sad_loc;

    // 2. Check sector matches ignoring case
    if (userSector.toLowerCase() !== sector.toLowerCase()) {
      return res.status(403).json({
        message: 'Please you can not Manage Ikimina outside your sector!'
      });
    }

    // 3. Check uniqueness within cell for this user
    const [existing] = await db.query(
      `SELECT * FROM ikimina_locations WHERE ikimina_name = ? AND cell = ? AND sad_id = ?`,
      [ikiminaName, cell, sad_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists in this cell for this user.' });
    }

    // 4. Insert new Ikimina location
    const sql = `
      INSERT INTO ikimina_locations
      (ikimina_name, province, district, sector, cell, village, sad_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [ikiminaName, province, district, sector, cell, village, sad_id]);

    res.status(201).json({ message: 'Ikimina location saved successfully.' });
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


router.get('/select', async (req, res) => {
  const sad_id = req.query.sad_id; // Or from auth token/session

  if (!sad_id) {
    return res.status(400).json({ message: 'User ID required' });
  }

  try {
    // Get user's sector
    const [userRows] = await db.query('SELECT sad_loc FROM supper_admin WHERE sad_id = ?', [sad_id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userSector = userRows[0].sad_loc;

    // Get Ikimina locations only in user's sector
    const [locations] = await db.query(
      'SELECT * FROM ikimina_locations WHERE sad_id = ? AND LOWER(sector) = LOWER(?)',
      [sad_id, userSector]
    );

    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/update/:id', async (req, res) => {
  const sad_id = req.body.sad_id; // Or from auth
  const id = req.params.id; // Location id to update
  const { ikiminaName, province, district, sector, cell, village } = req.body;

  if (!sad_id) {
    return res.status(400).json({ message: 'User ID required' });
  }

  try {
    // Get user's sector
    const [userRows] = await db.query('SELECT sad_loc FROM supper_admin WHERE sad_id = ?', [sad_id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userSector = userRows[0].sad_loc;

    // Get current location to update
    const [locationRows] = await db.query('SELECT sector FROM ikimina_locations WHERE id = ? AND sad_id = ?', [id, sad_id]);
    if (locationRows.length === 0) {
      return res.status(404).json({ message: 'Ikimina location not found for this user' });
    }

    if (locationRows[0].sector.toLowerCase() !== userSector.toLowerCase()) {
      return res.status(403).json({ message: 'You can only update Ikimina locations within your sector' });
    }

    // Also check that new sector value does not violate rule:
    if (sector.toLowerCase() !== userSector.toLowerCase()) {
      return res.status(403).json({ message: 'You cannot change Ikimina sector outside your own sector' });
    }

    // Proceed with update
    const sql = `
      UPDATE ikimina_locations
      SET ikimina_name = ?, province = ?, district = ?, sector = ?, cell = ?, village = ?
      WHERE id = ? AND sad_id = ?
    `;

    await db.query(sql, [ikiminaName, province, district, sector, cell, village, id, sad_id]);

    res.json({ message: 'Ikimina location updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/delete/:id', async (req, res) => {
  const sad_id = req.body.sad_id; // Or from auth
  const id = req.params.id;

  if (!sad_id) {
    return res.status(400).json({ message: 'User ID required' });
  }

  try {
    // Get user's sector
    const [userRows] = await db.query('SELECT sad_loc FROM supper_admin WHERE sad_id = ?', [sad_id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userSector = userRows[0].sad_loc;

    // Check if location belongs to user and sector matches
    const [locationRows] = await db.query('SELECT sector FROM ikimina_locations WHERE id = ? AND sad_id = ?', [id, sad_id]);
    if (locationRows.length === 0) {
      return res.status(404).json({ message: 'Ikimina location not found for this user' });
    }

    if (locationRows[0].sector.toLowerCase() !== userSector.toLowerCase()) {
      return res.status(403).json({ message: 'You can only delete Ikimina locations within your sector' });
    }

    // Delete
    await db.query('DELETE FROM ikimina_locations WHERE id = ? AND sad_id = ?', [id, sad_id]);

    res.json({ message: 'Ikimina location deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router; // ✅ <--- THIS IS REQUIRED
