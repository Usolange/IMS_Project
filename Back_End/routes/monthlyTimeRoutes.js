const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Helper: get userId from header or req.user (depending on your auth setup)
function getUserId(req) {
  return req.user?.id || req.headers['x-sad-id'];
}

// GET all monthly times for the logged-in user
router.get('/monthly', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized: user not logged in' });

  try {
    const [rows] = await db.execute(
      `SELECT m.*
       FROM Ik_monthly_time_info m
       JOIN frequency_category_info c ON m.f_id = c.f_id
       WHERE c.sad_id = ?`,
      [userId]
    );

    // Group rows by ikimina_name, monthlytime_time, f_id and aggregate dates into arrays
    const grouped = {};
    for (const row of rows) {
      const key = `${row.ikimina_name}|${row.monthlytime_time}|${row.f_id}`;
      if (!grouped[key]) {
        grouped[key] = {
          monthlytime_id: row.monthlytime_id, // maybe just first id
          ikimina_name: row.ikimina_name,
          monthlytime_time: row.monthlytime_time,
          f_id: row.f_id,
          monthlytime_dates: []
        };
      }
      grouped[key].monthlytime_dates.push(row.monthlytime_date);
    }

    res.json(Object.values(grouped));
  } catch (error) {
    console.error('Error fetching monthly times:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST: Add new monthly times (multiple rows, one date each)
router.post('/', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized: user not logged in' });

  const { ikimina_name, monthlytime_dates, monthlytime_time, f_id } = req.body;

  if (!ikimina_name || !monthlytime_dates || !monthlytime_time || !f_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (!Array.isArray(monthlytime_dates) || monthlytime_dates.some(d => Number(d) < 1 || Number(d) > 31)) {
    return res.status(400).json({ message: 'Days must be between 1 and 31' });
  }

  try {
    // Check ownership of f_id
    const [categoryRows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [f_id, userId]
    );
    if (categoryRows.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Check uniqueness of ikimina_name for this f_id
    const [existing] = await db.execute(
      'SELECT * FROM Ik_monthly_time_info WHERE ikimina_name = ? AND f_id = ?',
      [ikimina_name.trim(), f_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists for this frequency category.' });
    }

    // Insert each date as a separate row
    const insertPromises = monthlytime_dates.map(date =>
      db.execute(
        `INSERT INTO Ik_monthly_time_info
         (ikimina_name, monthlytime_date, monthlytime_time, f_id)
         VALUES (?, ?, ?, ?)`,
        [ikimina_name.trim(), date.toString(), monthlytime_time, f_id]
      )
    );

    await Promise.all(insertPromises);

    res.status(201).json({ message: 'Monthly times added successfully.', addedDates: monthlytime_dates });
  } catch (error) {
    console.error('Error saving monthly times:', error.message);
    res.status(500).json({ message: 'Internal server error while adding monthly times.' });
  }
});

// PUT: Update a monthly time entry (replace all dates for this ikimina_name & f_id)
router.put('/:id', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized: user not logged in' });

  const { id } = req.params;
  const { ikimina_name, monthlytime_dates, monthlytime_time, f_id } = req.body;

  if (
    !ikimina_name ||
    !monthlytime_dates ||
    !monthlytime_time ||
    !f_id ||
    !Array.isArray(monthlytime_dates) ||
    monthlytime_dates.some(d => Number(d) < 1 || Number(d) > 31)
  ) {
    return res.status(400).json({ message: 'Missing or invalid required fields' });
  }

  try {
    // Verify ownership of frequency category
    const [categoryRows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [f_id, userId]
    );
    if (categoryRows.length === 0) {
      return res.status(403).json({ message: 'Frequency category not found or unauthorized' });
    }

    // Verify that the monthlytime_id exists and belongs to this f_id
    const [existingEntry] = await db.execute(
      'SELECT * FROM Ik_monthly_time_info WHERE monthlytime_id = ? AND f_id = ?',
      [id, f_id]
    );
    if (existingEntry.length === 0) {
      return res.status(404).json({ message: 'Monthly time entry not found or unauthorized' });
    }

    // Check uniqueness of ikimina_name for this f_id excluding this record(s)
    const [duplicates] = await db.execute(
      'SELECT * FROM Ik_monthly_time_info WHERE ikimina_name = ? AND f_id = ? AND monthlytime_id != ?',
      [ikimina_name.trim(), f_id, id]
    );
    if (duplicates.length > 0) {
      return res.status(409).json({ message: 'Ikimina name already exists for this frequency category.' });
    }

    // Delete existing entries for this ikimina_name and f_id to replace dates
    await db.execute(
      'DELETE FROM Ik_monthly_time_info WHERE ikimina_name = ? AND f_id = ?',
      [existingEntry[0].ikimina_name, f_id]
    );

    // Insert new dates
    const insertPromises = monthlytime_dates.map(date =>
      db.execute(
        `INSERT INTO Ik_monthly_time_info
         (ikimina_name, monthlytime_date, monthlytime_time, f_id)
         VALUES (?, ?, ?, ?)`,
        [ikimina_name.trim(), date.toString(), monthlytime_time, f_id]
      )
    );
    await Promise.all(insertPromises);

    res.status(200).json({ message: 'Monthly times updated successfully.' });
  } catch (error) {
    console.error('Error updating monthly times:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE: Remove monthly time entry by ID with ownership check
router.delete('/:id', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized: user not logged in' });

  const { id } = req.params;

  try {
    // Verify ownership
    const [rows] = await db.execute(
      `SELECT m.monthlytime_id
       FROM Ik_monthly_time_info m
       JOIN frequency_category_info c ON m.f_id = c.f_id
       WHERE m.monthlytime_id = ? AND c.sad_id = ?`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Monthly time not found or unauthorized' });
    }

    await db.execute('DELETE FROM Ik_monthly_time_info WHERE monthlytime_id = ?', [id]);
    res.status(200).json({ message: 'Monthly time deleted successfully.' });
  } catch (error) {
    console.error('Error deleting monthly time:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
