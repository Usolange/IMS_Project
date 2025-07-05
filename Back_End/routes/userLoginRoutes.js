require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// ————————————————
// ✅ LOGIN API
// ————————————————
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Identifier and password are required.' });
  }

  try {
    // SUPER-ADMIN login
    const [adminRows] = await db.execute(
      `SELECT sad_id, sad_names, sad_email, sad_username, sad_phone, sad_pass, sad_loc
       FROM supper_admin
       WHERE sad_email = ? OR sad_username = ? OR sad_phone = ?`,
      [identifier, identifier, identifier]
    );

    if (adminRows.length) {
      const admin = adminRows[0];
      if (password === admin.sad_pass) {  // TODO: hash check
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
      } else {
        return res.status(401).json({ message: 'Incorrect password.' });
      }
    }

    // MEMBER login via member_code
    const [accessRows] = await db.execute(
      `SELECT member_id, member_code, member_pass FROM member_access_info WHERE member_code = ?`,
      [identifier]
    );

    if (accessRows.length) {
      const memberAccess = accessRows[0];

      if (password === memberAccess.member_pass) {  // TODO: hash check
        const [memberRows] = await db.execute(
          `SELECT member_id, member_names, member_Nid, gm_Nid, member_phone_number, member_email, member_type_id, iki_id
           FROM members_info WHERE member_id = ?`,
          [memberAccess.member_id]
        );

        if (memberRows.length) {
          const m = memberRows[0];

          let ikimina_name = '';
          if (m.iki_id) {
            const [ikiminaRows] = await db.execute(
              `SELECT iki_name FROM ikimina_info WHERE iki_id = ?`,
              [m.iki_id]
            );
            if (ikiminaRows.length) {
              ikimina_name = ikiminaRows[0].iki_name;
            }
          }

          const token = jwt.sign(
            { userId: m.member_id, role: 'member' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
          );

          return res.json({
            token,
            user: {
              member_id: m.member_id,
              member_names: m.member_names,
              member_Nid: m.member_Nid,
              gm_Nid: m.gm_Nid,
              member_phone_number: m.member_phone_number,
              member_email: m.member_email,
              member_type_id: m.member_type_id,
              iki_id: m.iki_id,
              member_code: memberAccess.member_code,
              ikimina_name,
              role: 'member'
            }
          });
        } else {
          return res.status(404).json({ message: 'Member details not found.' });
        }
      } else {
        return res.status(401).json({ message: 'Incorrect password.' });
      }
    }

    // IKIMINA login — UPDATED PART ONLY
    const [ikRows] = await db.execute(
      `SELECT i.iki_id, i.iki_name, i.iki_email, i.iki_username, i.iki_password, i.iki_location, i.f_id, i.dayOfEvent, i.timeOfEvent, i.numberOfEvents,
              l.cell, l.village, l.sector, l.district, l.province
       FROM ikimina_info AS i
       LEFT JOIN ikimina_locations AS l ON i.iki_id = l.ikimina_id
       WHERE LOWER(i.iki_email) = LOWER(?) OR LOWER(i.iki_username) = LOWER(?)`,
      [identifier, identifier]
    );

    if (ikRows.length) {
      const ik = ikRows[0];
      if (password === ik.iki_password) {  // no hash check as requested

        // *** Here: return only Ikimina info and token, no members ***

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
            role: 'ikimina'
          }
        });
      } else {
        return res.status(401).json({ message: 'Incorrect password.' });
      }
    }

    // Not found
    return res.status(404).json({ message: 'User not found.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Try again later.' });
  }
});

// ————————————————
// ✅ REGISTER SUPER-ADMIN
// ————————————————
router.post('/register', async (req, res) => {
  const { name, email, phone, username, password } = req.body;

  if (!name || !email || !username || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const [existingUser] = await db.execute(
      `SELECT sad_id FROM supper_admin WHERE sad_email = ? OR sad_username = ?`,
      [email, username]
    );

    if (existingUser.length) {
      return res.status(400).json({ message: 'Email or Username already exists.' });
    }

    const [result] = await db.execute(
      `INSERT INTO supper_admin (sad_names, sad_email, sad_phone, sad_username, sad_pass)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone, username, password]
    );

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
    res.status(500).json({ message: 'Internal Server Error, please try again later.' });
  }
});

module.exports = router;
