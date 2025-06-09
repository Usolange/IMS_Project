// routes/ikimina.js

const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Add Ikimina info
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email & password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO ikimina_info (iki_name, iki_email, iki_password) VALUES (?, ?, ?)`,
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: 'Ikimina added successfully.',
      ikimina: { id: result.insertId, name, email }
    });
  } catch (err) {
    console.error('Error adding ikimina info:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all Ikimina info
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM ikimina_info');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching ikimina info:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update Ikimina info
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email & password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `UPDATE ikimina_info SET iki_name = ?, iki_email = ?, iki_password = ? WHERE iki_id = ?`,
      [name, email, hashedPassword, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ikimina not found.' });
    }

    res.json({ message: 'Ikimina updated successfully.' });
  } catch (err) {
    console.error('Error updating ikimina info:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete Ikimina info
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute('DELETE FROM ikimina_info WHERE iki_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ikimina not found.' });
    }

    res.json({ message: 'Ikimina deleted successfully.' });
  } catch (err) {
    console.error('Error deleting ikimina info:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
