// routes/supperAdmin.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
// ————————————————
// ✅ LOGIN API (plain‑text)
// ————————————————
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Identifier and password are required.' });
  }

  try {
    // 1) Super‑Admin
    const [adminRows] = await db.execute(
      `SELECT sad_id, sad_names, sad_email, sad_username, sad_phone, sad_pass,sad_loc
       FROM supper_admin
       WHERE sad_email = ? OR sad_username = ? OR sad_phone = ?`,
      [identifier, identifier, identifier]
    );

    if (adminRows.length) {
      const admin = adminRows[0];
      if (password === admin.sad_pass) {
        const token = jwt.sign(
          { userId: admin.sad_id, role: 'admin' },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        return res.json({
          token,
          user: {
            id: admin.sad_id,
            name: admin.sad_names,
            email: admin.sad_email,
            phone: admin.sad_phone,
            username: admin.sad_username,
            userLocation: admin.sad_loc,
            role: 'admin'
          }
        });
      }
    }

    // 2) Member
    const [memberRows] = await db.execute(
      `SELECT m_id, m_names, m_email, m_phone_number, m_type_id, iki_id, m_password
       FROM members_info
       WHERE m_email = ? OR m_phone_number = ?`,
      [identifier, identifier]
    );
    if (memberRows.length) {
      const m = memberRows[0];
      if (password === m.m_password) {
        const token = jwt.sign(
          { userId: m.m_id, role: 'member' },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        return res.json({
          token,
          user: {
            id: m.m_id,
            name: m.m_names,
            email: m.m_email,
            phone: m.m_phone_number,
            type_id: m.m_type_id,
            iki_id: m.iki_id,
            role: 'member'
          }
        });
      }
    }

    // 3) Ikimina
    const [ikRows] = await db.execute(
      `SELECT iki_id, iki_name, iki_email, iki_password
       FROM ikimina_info
       WHERE iki_email = ?`,
      [identifier]
    );
    if (ikRows.length) {
      const ik = ikRows[0];
      if (password === ik.iki_password) {
        const token = jwt.sign(
          { userId: ik.iki_id, role: 'ikimina' },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        return res.json({
          token,
          user: {
            id: ik.iki_id,
            name: ik.iki_name,
            email: ik.iki_email,
            role: 'ikimina'
          }
        });
      }
    }

    // No match
    res.status(401).json({ message: 'Invalid credentials.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// ✅ REGISTER SUPER‑ADMIN (plain-text password)
router.post('/register', async (req, res) => {
  const { name, email, phone, username, password } = req.body;
  
  // Validate input
  if (!name || !email || !username || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Check if email or username already exists
    const [existingUser] = await db.execute(
      `SELECT sad_id FROM supper_admin WHERE sad_email = ? OR sad_username = ?`,
      [email, username]
    );
    if (existingUser.length) {
      return res.status(400).json({ message: 'Email or Username already exists.' });
    }

    // Insert new super admin into the database
    const [result] = await db.execute(
      `INSERT INTO supper_admin (sad_names, sad_email, sad_phone, sad_username, sad_pass)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone, username, password]
    );

    // Send success response
    res.status(201).json({
      message: 'Super-admin successfully registered!',
      user: {
        id: result.insertId,
        name,
        email,
        phone,
        username
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email or Username already exists.' });
    }
    // Generic server error
    res.status(500).json({ message: 'Internal Server Error, please try again later.' });
  }
});

module.exports = router;