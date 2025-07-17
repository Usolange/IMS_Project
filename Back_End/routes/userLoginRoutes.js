// routes/supperAdmin.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool, sql, poolConnect } = require('../config/db');

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
    await poolConnect;

    // ——— 1) Ikimina login
    const ikResult = await pool.request()
      .input('identifier', sql.VarChar(100), identifier)
      .query(`
        SELECT 
          i.iki_id, i.iki_name, i.iki_email, i.iki_username, i.iki_password,
          i.location_id, i.f_id, i.dayOfEvent, i.timeOfEvent, i.numberOfEvents,
          l.cell, l.village, l.sector, l.district, l.province
        FROM ikimina_info i
        LEFT JOIN ikimina_locations l ON i.location_id = l.location_id
        WHERE LOWER(i.iki_email) = LOWER(@identifier) OR LOWER(i.iki_username) = LOWER(@identifier)
      `);

    const ikRows = ikResult.recordset;

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
            location: ik.location_id,
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
    const adminResult = await pool.request()
      .input('identifier', sql.VarChar(100), identifier)
      .query(`
        SELECT sad_id, sad_names, sad_email, sad_username, sad_phone, sad_pass, sad_loc
        FROM supper_admin
        WHERE sad_email = @identifier OR sad_username = @identifier OR sad_phone = @identifier
      `);

    const adminRows = adminResult.recordset;

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

    // ——— 3) Member login
    const memberResult = await pool.request()
      .input('identifier', sql.VarChar(100), identifier)
      .input('password', sql.VarChar(100), password)
      .query(`
        SELECT 
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
        WHERE a.member_code = @identifier AND a.member_pass = @password
      `);

    const accessRows = memberResult.recordset;

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
    }

    return res.status(404).json({ message: 'User not found with provided credentials.' });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error. Try again later.' });
  }
});

module.exports = router;
