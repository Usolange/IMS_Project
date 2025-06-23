const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Get all member types
router.get('/select', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Member_type_info');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching member types:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add a new member type
router.post('/newMemberType', async (req, res) => {
  const { typeName, description } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO Member_type_info (type_name, description) VALUES (?, ?)',
      [typeName, description]
    );
    res.status(201).json({ id: result.insertId, typeName, description });
  } catch (error) {
    console.error('Error adding member type:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update a member type
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { typeName, description } = req.body;
  try {
    await db.execute(
      'UPDATE Member_type_info SET type_name = ?, description = ? WHERE id = ?',
      [typeName, description, id]
    );
    res.status(200).json({ id, typeName, description });
  } catch (error) {
    console.error('Error updating member type:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a member type
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM Member_type_info WHERE id = ?', [id]);
    res.status(200).json({ message: 'Member type deleted successfully' });
  } catch (error) {
    console.error('Error deleting member type:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
