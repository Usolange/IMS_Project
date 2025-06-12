const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Get all categories for the logged-in user based on x-sad-id header
router.get('/selectCategories', async (req, res) => {
  const sadId = req.headers['x-sad-id'];
  console.log('GET /selectCategories', { sadId });

  if (!sadId) return res.status(401).json({ message: 'Unauthorized: sadId missing' });

  try {
    const [rows] = await db.execute(
      'SELECT f_id, f_category, sad_id FROM frequency_category_info WHERE sad_id = ?',
      [sadId]
    );

    console.log('Fetched rows:', rows);

    const mappedRows = rows.map(row => ({
      f_id: row.f_id,
      f_category: row.f_category,
      createdBy: row.sad_id,
    }));

    res.json(mappedRows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Add a new category
router.post('/newCategory', async (req, res) => {
  const sadId = req.headers['x-sad-id'];
  const { categoryName } = req.body;

  console.log('POST /newCategory', { sadId, categoryName });

  if (!sadId) return res.status(401).json({ message: 'Unauthorized: sadId missing' });
  if (!categoryName || categoryName.trim() === '') {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    // Check for duplicates (case-insensitive)
    const [existing] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE LOWER(f_category) = LOWER(?) AND sad_id = ?',
      [categoryName, sadId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    // Insert new category
    const [result] = await db.execute(
      'INSERT INTO frequency_category_info (f_category, sad_id) VALUES (?, ?)',
      [categoryName, sadId]
    );

    res.status(201).json({ id: result.insertId, categoryName, createdBy: sadId });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ message: 'Error saving category' });
  }
});


// Update category by id
router.put('/:id', async (req, res) => {
  const sadId = req.headers['x-sad-id'];
  const { id } = req.params;
  const { categoryName } = req.body;

  if (!sadId) return res.status(401).json({ message: 'Unauthorized: sadId missing' });

  try {
    const [rows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [id, sadId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized or category not found' });
    }

    await db.execute(
      'UPDATE frequency_category_info SET f_category = ? WHERE f_id = ? AND sad_id = ?',
      [categoryName, id, sadId]
    );

    res.status(200).json({ id, categoryName, createdBy: sadId });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete category by id
router.delete('/:id', async (req, res) => {
  const sadId = req.headers['x-sad-id'];
  const { id } = req.params;

  if (!sadId) return res.status(401).json({ message: 'Unauthorized: sadId missing' });

  try {
    const [rows] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [id, sadId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized or category not found' });
    }

    await db.execute(
      'DELETE FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [id, sadId]
    );

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
