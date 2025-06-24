const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Get all member types
router.get('/select', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM member_type_info');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching member types:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add a new member type
router.post('/newMemberType', async (req, res) => {
  const { member_type, type_desc } = req.body;

  if (!member_type || member_type.trim() === '') {
    return res.status(400).json({ message: 'Member Type is required.' });
  }

  if (member_type.trim().length < 3) {
    return res.status(400).json({ message: 'Member Type must be at least 3 characters.' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO member_type_info (member_type, type_desc) VALUES (?, ?)',
      [member_type.trim(), type_desc || null]
    );
    res.status(201).json({
      id: result.insertId,
      member_type: member_type.trim(),
      type_desc: type_desc || ''
    });
  } catch (error) {
    console.error('Error adding member type:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update a member type
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { member_type, type_desc } = req.body;

  if (!member_type || member_type.trim() === '') {
    return res.status(400).json({ message: 'Member Type is required.' });
  }

  if (member_type.trim().length < 3) {
    return res.status(400).json({ message: 'Member Type must be at least 3 characters.' });
  }

  try {
    await db.execute(
      'UPDATE member_type_info SET member_type = ?, type_desc = ? WHERE member_type_id = ?',
      [member_type.trim(), type_desc || null, id]
    );
    res.status(200).json({ id, member_type, type_desc });
  } catch (error) {
    console.error('Error updating member type:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a member type
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM member_type_info WHERE member_type_id = ?', [id]);
    res.status(200).json({ message: 'Member type deleted successfully' });
  } catch (error) {
    console.error('Error deleting member type:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
