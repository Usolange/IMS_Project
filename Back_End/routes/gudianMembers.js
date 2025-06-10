const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Get all Gudian members
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Gudian_members');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching Gudian members:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add a new Gudian member
router.post('/', async (req, res) => {
  const { name, memberTypeId } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO Gudian_members (name, member_type_id) VALUES (?, ?)',
      [name, memberTypeId]
    );
    res.status(201).json({ id: result.insertId, name, memberTypeId });
  } catch (error) {
    console.error('Error adding Gudian member:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update a Gudian member
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, memberTypeId } = req.body;
  try {
    await db.execute(
      'UPDATE Gudian_members SET name = ?, member_type_id = ? WHERE id = ?',
      [name, memberTypeId, id]
    );
    res.status(200).json({ id, name, memberTypeId });
  } catch (error) {
    console.error('Error updating Gudian member:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a Gudian member
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM Gudian_members WHERE id = ?', [id]);
    res.status(200).json({ message: 'Gudian member deleted successfully' });
  } catch (error) {
    console.error('Error deleting Gudian member:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
