const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ✅ Import shared DB connection
const jwt = require('jsonwebtoken');

// ✅ LOGIN API
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Identifier and password are required.' });
  }

  try {
    // Check Super Admin
    const [adminRows] = await db.execute(
      `SELECT sad_id, sad_names, sad_email, sad_username, sad_phone, sad_pass 
       FROM supper_admin 
       WHERE sad_email = ? OR sad_username = ? OR sad_phone = ?`,
      [identifier, identifier, identifier]
    );

    if (adminRows.length && adminRows[0].sad_pass === password) {
      return res.json({
        token: 'fake-jwt-token',
        user: {
          id: adminRows[0].sad_id,
          name: adminRows[0].sad_names,
          email: adminRows[0].sad_email,
          phone: adminRows[0].sad_phone,
          username: adminRows[0].sad_username,
          role: 'admin',
        },
      });
    }

    // Check Members
    const [memberRows] = await db.execute(
      `SELECT m_id, m_names, m_email, m_phone_number, m_type_id, iki_id 
       FROM members_info 
       WHERE m_email = ? OR m_phone_number = ?`,
      [identifier, identifier]
    );

    if (memberRows.length) {
      return res.json({
        token: 'fake-jwt-token',
        user: {
          id: memberRows[0].m_id,
          name: memberRows[0].m_names,
          email: memberRows[0].m_email,
          phone: memberRows[0].m_phone_number,
          type_id: memberRows[0].m_type_id,
          iki_id: memberRows[0].iki_id,
          role: 'member',
        },
      });
    }

    // Check Ikimina
    const [ikiminaRows] = await db.execute(
      `SELECT iki_id, iki_name, iki_email 
       FROM ikimina_info 
       WHERE iki_email = ?`,
      [identifier]
    );

    if (ikiminaRows.length) {
      return res.json({
        token: 'fake-jwt-token',
        user: {
          id: ikiminaRows[0].iki_id,
          name: ikiminaRows[0].iki_name,
          email: ikiminaRows[0].iki_email,
          role: 'ikimina',
        },
      });
    }

    return res.status(401).json({ message: 'Invalid credentials.' });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// ✅ UPDATE SUPER ADMIN PROFILE
router.put('/supperAdmin/:id', async (req, res) => {
  const { name, email, username, phone } = req.body;
  const userId = req.params.id;

  if (!name || !email || !username) {
    return res.status(400).json({ message: 'Please provide name, email, and username' });
  }

  try {
    const [rows] = await db.execute(
      'UPDATE supper_admin SET sad_names = ?, sad_email = ?, sad_username = ?, sad_phone = ? WHERE sad_id = ?',
      [name, email, username, phone, userId]
    );

    if (rows.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [updatedRows] = await db.execute(
      'SELECT * FROM supper_admin WHERE sad_id = ?',
      [userId]
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedRows[0],
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
