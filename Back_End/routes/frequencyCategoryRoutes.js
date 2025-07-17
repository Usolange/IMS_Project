const express = require('express');
const { sql, pool, poolConnect } = require('../config/db');

const router = express.Router();

// Get all categories for logged-in admin (using x-sad-id header)
router.get('/selectCategories', async (req, res) => {
  const sadId = req.headers['x-sad-id'];
  if (!sadId) return res.status(401).json({ message: 'Unauthorized: sadId missing' });

  try {
    await poolConnect;
    const request = pool.request();
    request.input('sadId', sql.Int, sadId);
    const result = await request.query(`
      SELECT f.f_id, f.f_category, a.sad_names
      FROM frequency_category_info f
      JOIN supper_admin a ON f.sad_id = a.sad_id
      WHERE f.sad_id = @sadId
    `);

    const categories = result.recordset.map(row => ({
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
    await poolConnect;
    const request = pool.request();
    request.input('f_id', sql.Int, f_id);
    request.input('sadId', sql.Int, sadId);
    const result = await request.query(`
      SELECT f_category FROM frequency_category_info 
      WHERE f_id = @f_id AND sad_id = @sadId
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const category = result.recordset[0].f_category.toLowerCase();

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
    await poolConnect;

    // Check if category already exists (case-insensitive)
    const checkReq = pool.request();
    checkReq.input('categoryName', sql.NVarChar, categoryName);
    checkReq.input('sadId', sql.Int, sadId);
    const checkRes = await checkReq.query(`
      SELECT * FROM frequency_category_info 
      WHERE LOWER(f_category) = LOWER(@categoryName) AND sad_id = @sadId
    `);

    if (checkRes.recordset.length > 0) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    // Insert new category
    const insertReq = pool.request();
    insertReq.input('categoryName', sql.NVarChar, categoryName);
    insertReq.input('sadId', sql.Int, sadId);
    const insertRes = await insertReq.query(`
      INSERT INTO frequency_category_info (f_category, sad_id) 
      VALUES (@categoryName, @sadId);
      SELECT SCOPE_IDENTITY() AS insertedId;
    `);

    const insertedId = insertRes.recordset[0].insertedId;

    res.status(201).json({ id: insertedId, categoryName, createdBy: sadId });
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
    await poolConnect;
    const selectReq = pool.request();
    selectReq.input('id', sql.Int, id);
    selectReq.input('sadId', sql.Int, sadId);
    const selectRes = await selectReq.query(`
      SELECT * FROM frequency_category_info WHERE f_id = @id AND sad_id = @sadId
    `);

    if (selectRes.recordset.length === 0) {
      return res.status(403).json({ message: 'Unauthorized or category not found' });
    }

    const updateReq = pool.request();
    updateReq.input('categoryName', sql.NVarChar, categoryName);
    updateReq.input('id', sql.Int, id);
    updateReq.input('sadId', sql.Int, sadId);
    await updateReq.query(`
      UPDATE frequency_category_info 
      SET f_category = @categoryName 
      WHERE f_id = @id AND sad_id = @sadId
    `);

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
    await poolConnect;
    const selectReq = pool.request();
    selectReq.input('id', sql.Int, id);
    selectReq.input('sadId', sql.Int, sadId);
    const selectRes = await selectReq.query(`
      SELECT * FROM frequency_category_info WHERE f_id = @id AND sad_id = @sadId
    `);

    if (selectRes.recordset.length === 0) {
      return res.status(403).json({ message: 'Unauthorized or category not found' });
    }

    const deleteReq = pool.request();
    deleteReq.input('id', sql.Int, id);
    deleteReq.input('sadId', sql.Int, sadId);
    await deleteReq.query(`
      DELETE FROM frequency_category_info WHERE f_id = @id AND sad_id = @sadId
    `);

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
