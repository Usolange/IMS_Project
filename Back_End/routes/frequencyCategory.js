const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Get all categories for logged-in admin (using x-sad-id header)
router.get('/selectCategories', async (req, res) => {
  const sadId = req.headers['x-sad-id'];
  if (!sadId) return res.status(401).json({ message: 'Unauthorized: sadId missing' });

  try {
    const [rows] = await db.execute(
      `SELECT f.f_id, f.f_category, a.sad_names
       FROM frequency_category_info f
       JOIN supper_admin a ON f.sad_id = a.sad_id
       WHERE f.sad_id = ?`,
      [sadId]
    );

    const categories = rows.map(row => ({
      f_id: row.f_id,
      f_category: row.f_category,
      createdBy: row.sad_names,
    }));

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get category type by f_id
router.get('/type/:f_id', async (req, res) => {
  const sadId = req.headers['x-sad-id'];
  const { f_id } = req.params;
  if (!sadId) return res.status(401).json({ message: 'Unauthorized: sadId missing' });

  try {
    const [rows] = await db.execute(
      'SELECT f_category FROM frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [f_id, sadId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const category = rows[0].f_category.toLowerCase();

    if (!['daily', 'weekly', 'monthly'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category type' });
    }

    res.json({ type: category });
  } catch (error) {
    console.error('Error fetching category type:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add new category
router.post('/newCategory', async (req, res) => {
  const sadId = req.headers['x-sad-id'];
  const { categoryName } = req.body;

  if (!sadId) return res.status(401).json({ message: 'Unauthorized: sadId missing' });
  if (!categoryName || categoryName.trim() === '') {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    const [existing] = await db.execute(
      'SELECT * FROM frequency_category_info WHERE LOWER(f_category) = LOWER(?) AND sad_id = ?',
      [categoryName, sadId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Category already exists' });
    }

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
