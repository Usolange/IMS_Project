const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');

// Helpers
async function getUserSector(sad_id) {
  await poolConnect;
  const request = pool.request();
  const result = await request
    .input('sad_id', sql.Int, sad_id)
    .query('SELECT sad_loc FROM supper_admin WHERE sad_id = @sad_id');
  return result.recordset.length > 0 ? result.recordset[0].sad_loc : null;
}

function isSameSector(sectorA, sectorB) {
  if (!sectorA || !sectorB) return false;
  return sectorA.trim().toLowerCase() === sectorB.trim().toLowerCase();
}

// Create new location
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

    await poolConnect;

    // New request for duplicate check
    const duplicateRequest = pool.request();
    const duplicateCheck = await duplicateRequest
      .input('ikiminaName', sql.NVarChar, ikiminaName)
      .input('cell', sql.NVarChar, cell)
      .input('sad_id', sql.Int, sad_id)
      .query(`SELECT * FROM ikimina_locations WHERE ikimina_name = @ikiminaName AND cell = @cell AND sad_id = @sad_id`);

    if (duplicateCheck.recordset.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists in this cell for this user.' });
    }

    // New request for insert
    const insertRequest = pool.request();
    await insertRequest
      .input('ikiminaName', sql.NVarChar, ikiminaName)
      .input('province', sql.NVarChar, province)
      .input('district', sql.NVarChar, district)
      .input('sector', sql.NVarChar, sector)
      .input('cell', sql.NVarChar, cell)
      .input('village', sql.NVarChar, village)
      .input('f_id', sql.Int, f_id)
      .input('sad_id', sql.Int, sad_id)
      .query(`
        INSERT INTO ikimina_locations
        (ikimina_name, province, district, sector, cell, village, f_id, sad_id)
        VALUES (@ikiminaName, @province, @district, @sector, @cell, @village, @f_id, @sad_id)
      `);

    res.status(201).json({ message: 'Ikimina location saved successfully.' });
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get all locations for a user sector
router.get('/select', async (req, res) => {
  const sad_id = req.query.sad_id;
  if (!sad_id) {
    return res.status(400).json({ message: 'User ID required' });
  }

  try {
    await poolConnect;

    // New request for user sector
    const userSectorRequest = pool.request();
    const userResult = await userSectorRequest
      .input('sad_id', sql.Int, sad_id)
      .query('SELECT sad_loc FROM supper_admin WHERE sad_id = @sad_id');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userSector = userResult.recordset[0].sad_loc;

    // New request for locations
    const locationsRequest = pool.request();
    const locationsResult = await locationsRequest
      .input('sad_id', sql.Int, sad_id)
      .input('userSector', sql.NVarChar, userSector)
      .query('SELECT * FROM ikimina_locations WHERE sad_id = @sad_id AND LOWER(sector) = LOWER(@userSector)');

    res.json(locationsResult.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get available Ikimina locations 
router.get('/selectAvailableIkimina', async (req, res) => {
  const sad_id = req.query.sad_id;
  if (!sad_id) {
    return res.status(400).json({ message: 'User ID required' });
  }

  try {
    await poolConnect;

    // New request for user sector
    const userSectorRequest = pool.request();
    const userResult = await userSectorRequest
      .input('sad_id', sql.Int, sad_id)
      .query('SELECT sad_loc FROM supper_admin WHERE sad_id = @sad_id');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userSector = userResult.recordset[0].sad_loc;

    // New request for available locations
    const availableRequest = pool.request();
    const availableResult = await availableRequest
      .input('sad_id', sql.Int, sad_id)
      .input('userSector', sql.NVarChar, userSector)
      .query(`
       SELECT * FROM ikimina_locations l
WHERE l.sad_id = @sad_id
  AND LOWER(l.sector) = LOWER(@userSector)
  AND NOT EXISTS (
    SELECT 1 FROM ikimina_info i WHERE i.location_id = l.location_id
  )

      `);

    res.json(availableResult.recordset);
  } catch (err) {
    console.error('Error in /selectAvailableIkimina:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update location by location_id
router.put('/update/:location_id', async (req, res) => {
  const location_id = req.params.location_id;
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
    await poolConnect;

    const userSector = await getUserSector(sad_id);
    if (!userSector) return res.status(404).json({ message: 'User not found.' });

    // Separate request for checking location
    const locationCheckRequest = pool.request();
    const locationResult = await locationCheckRequest
      .input('location_id', sql.Int, location_id)
      .input('sad_id', sql.Int, sad_id)
      .query('SELECT sector FROM ikimina_locations WHERE location_id = @location_id AND sad_id = @sad_id');

    if (locationResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Ikimina location not found for this user.' });
    }

    const currentSector = locationResult.recordset[0].sector;
    if (!isSameSector(currentSector, userSector) || !isSameSector(sector, userSector)) {
      return res.status(403).json({ message: 'You can only update Ikimina within your own sector.' });
    }

    // Separate request for duplicates
    const duplicatesRequest = pool.request();
    const duplicatesResult = await duplicatesRequest
      .input('ikiminaName', sql.NVarChar, ikiminaName.trim())
      .input('cell', sql.NVarChar, cell)
      .input('sad_id', sql.Int, sad_id)
      .input('location_id', sql.Int, location_id)
      .query(`
        SELECT location_id FROM ikimina_locations 
        WHERE ikimina_name = @ikiminaName AND cell = @cell AND sad_id = @sad_id AND location_id != @location_id
      `);

    if (duplicatesResult.recordset.length > 0) {
      return res.status(409).json({ message: 'Another Ikimina with this name already exists in the same cell.' });
    }

    // Separate request for update
    const updateRequest = pool.request();
    await updateRequest
      .input('ikiminaName', sql.NVarChar, ikiminaName.trim())
      .input('province', sql.NVarChar, province)
      .input('district', sql.NVarChar, district)
      .input('sector', sql.NVarChar, sector)
      .input('cell', sql.NVarChar, cell)
      .input('village', sql.NVarChar, village)
      .input('f_id', sql.Int, f_id)
      .input('location_id', sql.Int, location_id)
      .input('sad_id', sql.Int, sad_id)
      .query(`
        UPDATE ikimina_locations
        SET ikimina_name = @ikiminaName, province = @province, district = @district,
            sector = @sector, cell = @cell, village = @village, f_id = @f_id
        WHERE location_id = @location_id AND sad_id = @sad_id
      `);

    res.json({ message: 'Ikimina location updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Delete location by location_id
router.delete('/delete/:location_id', async (req, res) => {
  const sad_id = req.body.sad_id; // Or from auth
  const location_id = req.params.location_id;

  if (!sad_id) {
    return res.status(400).json({ message: 'User ID required' });
  }

  try {
    await poolConnect;

    // Request for user sector
    const userSectorRequest = pool.request();
    const userResult = await userSectorRequest
      .input('sad_id', sql.Int, sad_id)
      .query('SELECT sad_loc FROM supper_admin WHERE sad_id = @sad_id');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userSector = userResult.recordset[0].sad_loc;

    // Request for location sector
    const locationSectorRequest = pool.request();
    const locationResult = await locationSectorRequest
      .input('location_id', sql.Int, location_id)
      .input('sad_id', sql.Int, sad_id)
      .query('SELECT sector FROM ikimina_locations WHERE location_id = @location_id AND sad_id = @sad_id');

    if (locationResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Ikimina location not found for this user' });
    }

    if (locationResult.recordset[0].sector.toLowerCase() !== userSector.toLowerCase()) {
      return res.status(403).json({ message: 'You can only delete Ikimina locations within your sector' });
    }

    // Request for delete
    const deleteRequest = pool.request();
    await deleteRequest
      .input('location_id', sql.Int, location_id)
      .input('sad_id', sql.Int, sad_id)
      .query('DELETE FROM ikimina_locations WHERE location_id = @location_id AND sad_id = @sad_id');

    res.json({ message: 'Ikimina location deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
