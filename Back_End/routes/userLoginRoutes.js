// routes/supperAdmin.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
// ————————————————
// ✅ LOGIN API (plain‑text)
// ————————————————
router.post('/login', async (req, res) => {
  let { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Identifier and password are required.' });
  }

  identifier = identifier.trim();
  password = password.trim();

  try {
    // ——— 1) Ikimina login
    const [ikRows] = await db.execute(
      `
  SELECT 
    i.iki_id, i.iki_name, i.iki_email, i.iki_username, i.iki_password,
    i.iki_location, i.f_id, i.dayOfEvent, i.timeOfEvent, i.numberOfEvents,
    l.cell, l.village, l.sector, l.district, l.province
  FROM ikimina_info i
  LEFT JOIN ikimina_locations l ON i.iki_location = l.location_id	
  WHERE LOWER(i.iki_email) = LOWER(?) OR LOWER(i.iki_username) = LOWER(?)
`,
      [identifier, identifier]
    );

    if (ikRows.length) {
      const ik = ikRows[0];
      if (password === ik.iki_password) {
        const token = jwt.sign({ userId: ik.iki_id, role: 'ikimina' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.json({
          token,
          user: {
            id: ik.iki_id,
            name: ik.iki_name,
            email: ik.iki_email,
            username: ik.iki_username,
            location: ik.iki_location,
            f_id: ik.f_id,
            dayOfEvent: ik.dayOfEvent,
            timeOfEvent: ik.timeOfEvent,
            numberOfEvents: ik.numberOfEvents,
            cell: ik.cell,
            village: ik.village,
            sector: ik.sector,
            district: ik.district,
            province: ik.province,
            role: 'ikimina',
          }
        });
      } else {
        return res.status(401).json({ message: 'Incorrect password.' });
      }
    }

    // ——— 2) Super Admin login
    const [adminRows] = await db.execute(
      `SELECT sad_id, sad_names, sad_email, sad_username, sad_phone, sad_pass, sad_loc
       FROM supper_admin
       WHERE sad_email = ? OR sad_username = ? OR sad_phone = ?`,
      [identifier, identifier, identifier]
    );

    if (adminRows.length) {
      const admin = adminRows[0];
      if (password === admin.sad_pass) {
        const token = jwt.sign({ userId: admin.sad_id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.json({
          token,
          user: {
            id: admin.sad_id,
            name: admin.sad_names,
            email: admin.sad_email,
            phone: admin.sad_phone,
            username: admin.sad_username,
            userLocation: admin.sad_loc,
            role: 'admin',
          },
        });
      } else {
        return res.status(401).json({ message: 'Incorrect password.' });
      }
    }

   // ——— 3) Member login (member_code + member_pass)
const [accessRows] = await db.execute(
  `SELECT 
     m.member_id, 
     m.member_names, 
     m.member_email, 
     m.member_phone_number, 
     m.member_type_id, 
     m.iki_id,
     a.member_code,
     i.iki_name
   FROM members_info m
   JOIN member_access_info a ON m.member_id = a.member_id
   LEFT JOIN ikimina_info i ON m.iki_id = i.iki_id
   WHERE a.member_code = ? AND a.member_pass = ?`,
  [identifier, password]
);

if (accessRows.length) {
  const m = accessRows[0];

  const token = jwt.sign(
    { userId: m.member_id, role: 'member' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return res.json({
    token,
    user: {
      id: m.member_id,
      name: m.member_names,
      email: m.member_email,
      phone: m.member_phone_number,
      type_id: m.member_type_id,
      iki_id: m.iki_id,
      ikimina_name: m.iki_name || '',
      member_code: m.member_code,
      role: 'member',
    },
  });
} else {
  return res.status(401).json({ message: 'Invalid member code or password.' });
}


    // ——— No match found
    return res.status(404).json({ message: 'User not found with provided credentials.' });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error. Try again later.' });
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