const express = require('express');
const db = require('../config/db');
const authenticateToken = require('../Middleware/authenticateToken');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// Get all categories for the logged-in user
router.get('/selectCategories', async (req, res) => {
  const sadId = req.user?.id;
  if (!sadId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const [rows] = await db.execute(
      'SELECT f_id, f_category, sad_id FROM Frequency_category_info WHERE sad_id = ?',
      [sadId]
    );

    const mappedRows = rows.map(row => ({
      f_id: row.f_id,
      f_category: row.f_category,
      createdBy: row.sad_id
    }));

    res.json(mappedRows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add a new category owned by this user
router.post('/newCategory', async (req, res) => {
  const sadId = req.user?.id;
  const { categoryName } = req.body;

  if (!sadId) return res.status(401).json({ message: 'Unauthorized' });
  if (!categoryName || categoryName.trim() === '') {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO Frequency_category_info (f_category, sad_id) VALUES (?, ?)',
      [categoryName, sadId]
    );
    res.status(201).json({ id: result.insertId, categoryName, createdBy: sadId });
  } catch (error) {
    console.error('Error adding frequency category:', error);
    res.status(500).json({ message: 'Error saving category' });
  }
});

// Update category (with param id)
router.put('/:id', async (req, res) => {
  const sadId = req.user?.id;
  const { id } = req.params;
  const { categoryName } = req.body;

  if (!sadId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const [rows] = await db.execute(
      'SELECT * FROM Frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [id, sadId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized or category not found' });
    }

    await db.execute(
      'UPDATE Frequency_category_info SET f_category = ? WHERE f_id = ? AND sad_id = ?',
      [categoryName, id, sadId]
    );
    res.status(200).json({ id, categoryName, createdBy: sadId });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete category (with param id)
router.delete('/:id', async (req, res) => {
  const sadId = req.user?.id;
  const { id } = req.params;

  if (!sadId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const [rows] = await db.execute(
      'SELECT * FROM Frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [id, sadId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized or category not found' });
    }

    await db.execute(
      'DELETE FROM Frequency_category_info WHERE f_id = ? AND sad_id = ?',
      [id, sadId]
    );
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
