const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');

router.put('/supperAdmin/:id',  async (req, res) => {

  `http://localhost:5000/api/supperAdmin/${user.id}`
  const { name, email, username, phone } = req.body;
  const id = req.params.id;

  if (!name || !email || !username) {
    return res.status(400).json({ message: 'Name, email & username required.' });
  }

  try {
    const sad_names = name;
    const sad_email = email;
    const sad_username = username;
    const sad_phone = phone;

    const [upd] = await db.execute(
      `UPDATE supper_admin
       SET sad_names = ?, sad_email = ?, sad_username = ?, sad_phone = ?
       WHERE sad_id = ?`,
      [sad_names, sad_email, sad_username, sad_phone, id]
    );

    if (upd.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const [rows] = await db.execute(
      `SELECT sad_id, sad_names, sad_email, sad_username, sad_phone
       FROM supper_admin WHERE sad_id = ?`,
      [id]
    );

    const user = {
      id: rows[0].sad_id,
      name: rows[0].sad_names,
      email: rows[0].sad_email,
      username: rows[0].sad_username,
      phone: rows[0].sad_phone,
    };

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
