// routes/frequency.js
const express = require('express');
const db = require('../config/db');
const router = express.Router();
const authenticateToken = require('./middleware/auth');

// GET all frequency categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Frequency_category_info');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching frequencies:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST: Create new frequency category
router.post('/', async (req, res) => {
  const { f_category } = req.body;
  if (!f_category) {
    return res.status(400).json({ message: 'f_category is required' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO Frequency_category_info (f_category) VALUES (?)',
      [f_category]
    );
    res.status(201).json({ id: result.insertId, f_category });
  } catch (err) {
    console.error('Error creating frequency:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT: Update a frequency category
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { f_category } = req.body;
  try {
    await db.execute(
      'UPDATE Frequency_category_info SET f_category = ? WHERE f_id = ?',
      [f_category, id]
    );
    res.status(200).json({ id, f_category });
  } catch (err) {
    console.error('Error updating frequency:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE: Remove a frequency category
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM Frequency_category_info WHERE f_id = ?', [id]);
    res.status(200).json({ message: 'Frequency category deleted successfully' });
  } catch (err) {
    console.error('Error deleting frequency:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
