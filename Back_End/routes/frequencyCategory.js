const express = require('express');
const db = require('../config/db');
const router = express.Router();

// ✅ Get all frequency categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Frequency_category_info');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/newCategory', async (req, res) => {
  console.log('Body received:', req.body); // 👈 Add this
  const { categoryName } = req.body;

  if (!categoryName || categoryName.trim() === '') {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO Frequency_category_info (f_category) VALUES (?)',
      [categoryName]
    );
    res.status(201).json({ id: result.insertId, categoryName });
  } catch (error) {
    console.error('Error adding frequency category:', error);
    res.status(500).json({ message: 'Error saving category' });
  }
});

// ✅ Update a frequency category
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { categoryName } = req.body;

  try {
    await db.execute(
      'UPDATE Frequency_category_info SET f_category = ? WHERE f_id = ?',
      [categoryName, id]
    );
    res.status(200).json({ id, categoryName });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ✅ Delete a frequency category
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM Frequency_category_info WHERE f_id = ?', [id]);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;