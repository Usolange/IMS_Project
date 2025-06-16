const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');


router.post('/register', async (req, res) => {
  const { name, email, username, phone, location, password } = req.body;

  if (!name || !email || !username || !phone || !location || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    console.log('Registering:', req.body); // Log input

    const [existingUser] = await db.execute(
      'SELECT * FROM supper_admin WHERE sad_email = ? OR sad_username = ?',
      [email, username]
    );

    if (existingUser.length > 0) {
      console.log('User already exists:', existingUser);
      return res.status(409).json({ message: 'Email or username already exists.' });
    }

    await db.execute(
      `INSERT INTO supper_admin 
       (sad_names, sad_email, sad_username, sad_phone, sad_loc, sad_pass) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, username, phone, location, password]
    );

    console.log('Registration successful');
    res.status(200).json({ message: 'Registration successful.' });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});





module.exports = router;
