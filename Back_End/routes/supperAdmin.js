// routes/supperAdmin.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');


// ————————————————
// ✅ UPDATE SUPER‑ADMIN PROFILE (protected with authenticateToken)
// ————————————————
router.put('/supperAdmin/:id', async (req, res) => {
  const { name, email, username, phone } = req.body;
  const id = req.params.id;
  if (!name || !email || !username) {
    return res.status(400).json({ message: 'Name, email & username required.' });
  }

  try {
    const [upd] = await db.execute(
      `UPDATE supper_admin
       SET sad_names = ?, sad_email = ?, sad_username = ?, sad_phone = ?
       WHERE sad_id = ?`,
      [name, email, username, phone, id]
    );
    if (upd.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const [rows] = await db.execute(
      `SELECT sad_id, sad_names, sad_email, sad_username, sad_phone
       FROM supper_admin WHERE sad_id = ?`,
      [id]
    );
    res.json({ message: 'Profile updated', user: rows[0] });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


module.exports = router;
