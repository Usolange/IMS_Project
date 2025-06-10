const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Get all member access info
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Member_access_info');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching member access info:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add new member access info
router.post('/', async (req, res) => {
  const { memberId, accessLevel } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO Member_access_info (member_id, access_level) VALUES (?, ?)',
      [memberId, accessLevel]
    );
    res.status(201).json({ id: result.insertId, memberId, accessLevel });
  } catch (error) {
    console.error('Error adding member access info:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update member access info
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { memberId, accessLevel } = req.body;
  try {
    await db.execute(
      'UPDATE Member_access_info SET member_id = ?, access_level = ? WHERE id = ?',
      [memberId, accessLevel, id]
    );
    res.status(200).json({ id, memberId, accessLevel });
  } catch (error) {
    console.error('Error updating member access info:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete member access info
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM Member_access_info WHERE id = ?', [id]);
    res.status(200).json({ message: 'Member access info deleted successfully' });
  } catch (error) {
    console.error('Error deleting member access info:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
