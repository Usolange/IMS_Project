const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db'); // Adjust path to your DB connection
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  const query = `SELECT * FROM users WHERE email = ? OR username = ? OR phone = ?`;
  db.query(query, [identifier, identifier, identifier], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      'your_secret_key',
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  });
});

module.exports = router;
