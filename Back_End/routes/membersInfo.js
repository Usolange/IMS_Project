// routes/members.js

const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Add a new member
router.post('/', async (req, res) => {
  const { name, email, phone, type_id, iki_id } = req.body;

  if (!name || !email || !phone || !type_id || !iki_id) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO members_info (m_names, m_email, m_phone_number, m_type_id, iki_id)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone, type_id, iki_id]
    );

    res.status(201).json({
      message: 'Member added successfully.',
      member: { id: result.insertId, name, email, phone, type_id, iki_id }
    });
  } catch (err) {
    console.error('Error adding member:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all members
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM members_info');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update a member
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, type_id, iki_id } = req.body;

  if (!name || !email || !phone || !type_id || !iki_id) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const [result] = await db.execute(
      `UPDATE members_info SET m_names = ?, m_email = ?, m_phone_number = ?, m_type_id = ?, iki_id = ? WHERE m_id = ?`,
      [name, email, phone, type_id, iki_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    res.json({ message: 'Member updated successfully.' });
  } catch (err) {
    console.error('Error updating member:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a member
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute('DELETE FROM members_info WHERE m_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    res.json({ message: 'Member deleted successfully.' });
  } catch (err) {
    console.error('Error deleting member:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
