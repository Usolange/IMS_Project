// routes/LocationManagerRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ✅ Add these missing helpers
async function getUserSector(sad_id) {
  const [rows] = await db.query('SELECT sad_loc FROM supper_admin WHERE sad_id = ?', [sad_id]);
  return rows.length > 0 ? rows[0].sad_loc : null;
}

function isSameSector(sectorA, sectorB) {
  if (!sectorA || !sectorB) return false;
  return sectorA.trim().toLowerCase() === sectorB.trim().toLowerCase();
}

router.post('/newLocation', async (req, res) => {
  const { ikiminaName, province, district, sector, cell, village, f_id, sad_id } = req.body;

  if (!ikiminaName || !province || !district || !sector || !cell || !village || !f_id || !sad_id) {
    return res.status(400).json({ message: 'All fields including category ID and user ID are required.' });
  }

  try {
    const userSector = await getUserSector(sad_id);
    if (!userSector) return res.status(404).json({ message: 'User not found.' });

    if (!isSameSector(userSector, sector)) {
      return res.status(403).json({ message: 'You can only manage Ikimina in your own sector.' });
    }

    // Check for duplicate in same cell and user
    const [existing] = await db.query(
      `SELECT * FROM ikimina_locations WHERE ikimina_name = ? AND cell = ? AND sad_id = ?`,
      [ikiminaName, cell, sad_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists in this cell for this user.' });
    }

    // Get new ikimina_id
    const [maxIdResult] = await db.query('SELECT MAX(ikimina_id) AS maxId FROM ikimina_locations');
    const newIkiminaId = (maxIdResult[0].maxId || 0) + 1;

    // Insert with f_id
    const sql = `
      INSERT INTO ikimina_locations
      (ikimina_id, ikimina_name, province, district, sector, cell, village, f_id, sad_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [newIkiminaId, ikiminaName, province, district, sector, cell, village, f_id, sad_id]);

    res.status(201).json({ message: 'Ikimina location saved successfully.' });
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


// GET Ikimina location info by iki_id
router.get('/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  try {
    const [rows] = await db.execute(
      'SELECT iki_name FROM ikimina_locations WHERE iki_id = ?',
      [iki_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found' });
    }

    res.json({ iki_name: rows[0].iki_name });
  } catch (error) {
    console.error('Error fetching ikimina location:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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

router.get('/selectAvailableIkimina', async (req, res) => {
  const sad_id = req.query.sad_id;

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

    // Get available Ikimina: same sector, same user, and not used in ikimina_info
    const [locations] = await db.query(
      `SELECT * FROM ikimina_locations 
       WHERE sad_id = ? 
         AND LOWER(sector) = LOWER(?) 
         AND id NOT IN (SELECT iki_location FROM ikimina_info)`,
      [sad_id, userSector]
    );

    res.json(locations);
  } catch (err) {
    console.error('Error in /selectAvailableIkimina:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.put('/update/:id', async (req, res) => {
  const id = req.params.id;
  const {
    ikiminaName,
    province,
    district,
    sector,
    cell,
    village,
    f_id,
    sad_id
  } = req.body;

  if (
    !ikiminaName?.trim() || !province?.trim() || !district?.trim() || !sector?.trim() ||
    !cell?.trim() || !village?.trim() || !f_id || !sad_id
  ) {
    return res.status(400).json({
      message: 'All fields including category ID and user ID are required.'
    });
  }

  try {
    const userSector = await getUserSector(sad_id);
    if (!userSector) return res.status(404).json({ message: 'User not found.' });

    const [locationRows] = await db.query(
      'SELECT sector FROM ikimina_locations WHERE id = ? AND sad_id = ?',
      [id, sad_id]
    );
    if (locationRows.length === 0) {
      return res.status(404).json({ message: 'Ikimina location not found for this user.' });
    }

    const currentSector = locationRows[0].sector;
    if (!isSameSector(currentSector, userSector) || !isSameSector(sector, userSector)) {
      return res.status(403).json({ message: 'You can only update Ikimina within your own sector.' });
    }

    const [duplicates] = await db.query(
      `SELECT id FROM ikimina_locations 
       WHERE ikimina_name = ? AND cell = ? AND sad_id = ? AND id != ?`,
      [ikiminaName.trim(), cell, sad_id, id]
    );
    if (duplicates.length > 0) {
      return res.status(409).json({ message: 'Another Ikimina with this name already exists in the same cell.' });
    }

    await db.query(
      `UPDATE ikimina_locations
       SET ikimina_name = ?, province = ?, district = ?, sector = ?, cell = ?, village = ?, f_id = ?
       WHERE id = ? AND sad_id = ?`,
      [ikiminaName.trim(), province, district, sector, cell, village, f_id, id, sad_id]
    );

    res.json({ message: 'Ikimina location updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Internal server error.' });
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
