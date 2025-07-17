const express = require('express');
const router = express.Router();
const { sql, poolConnect, pool } = require('../config/db');

// Register new Super Admin
router.post('/newSupperUser', async (req, res) => {
  const { name, email, username, phone, location, password } = req.body;

  // Validate input fields
  if (!name || !email || !username || !phone || !location || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    await poolConnect;

    // Check for duplicate email or username
    const checkRequest = pool.request();
    checkRequest.input('email', sql.VarChar(100), email);
    checkRequest.input('username', sql.VarChar(50), username);

    const duplicateCheck = await checkRequest.query(`
      SELECT sad_id FROM supper_admin
      WHERE sad_email = @email OR sad_username = @username
    `);

    if (duplicateCheck.recordset.length > 0) {
      return res.status(409).json({ message: 'Email or username already exists.' });
    }

    // Insert new Super Admin
    const insertRequest = pool.request();
    insertRequest.input('name', sql.VarChar(100), name);
    insertRequest.input('email', sql.VarChar(100), email);
    insertRequest.input('username', sql.VarChar(50), username);
    insertRequest.input('phone', sql.VarChar(15), phone);
    insertRequest.input('location', sql.VarChar(100), location);
    insertRequest.input('password', sql.VarChar(100), password); // stored as plain text

    await insertRequest.query(`
      INSERT INTO supper_admin (
        sad_names, sad_email, sad_username, sad_phone, sad_loc, sad_pass
      ) VALUES (
        @name, @email, @username, @phone, @location, @password
      )
    `);

    res.status(200).json({ message: 'Registration successful.' });

  } catch (error) {
    console.error('🛑 Registration Error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration.' });
  }
});

module.exports = router;
