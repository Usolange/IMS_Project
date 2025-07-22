const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');

const KIGALI_TZ = 'Africa/Kigali';


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

// Register new Super Admin with validation sector-level government emails are allowed
// router.post('/newSupperUser', async (req, res) => {
//   const { name, email, username, phone, location, password } = req.body;

//   // Validate input fields
//   if (!name || !email || !username || !phone || !location || !password) {
//     return res.status(400).json({ message: 'All fields are required.' });
//   }

//   // Validate email format (only sector-level domains like @nyarugenge.gov.rw)
//   const allowedSectorPattern = /^[a-zA-Z0-9._%+-]+@([a-z]+)\.gov\.rw$/;
//   const excludedDomains = ['mineduc', 'minagri', 'moh', 'migeprof', 'rra', 'risa', 'parliament', 'rgb', 'rib'];

//   const match = email.match(allowedSectorPattern);
//   if (!match || excludedDomains.includes(match[1].toLowerCase())) {
//     return res.status(400).json({
//       message: 'Only sector-level government emails are allowed (e.g. user@nyarugenge.gov.rw)',
//     });
//   }

//   try {
//     await poolConnect;

//     // Check for duplicate email or username
//     const checkRequest = pool.request();
//     checkRequest.input('email', sql.VarChar(100), email);
//     checkRequest.input('username', sql.VarChar(50), username);

//     const duplicateCheck = await checkRequest.query(`
//       SELECT sad_id FROM supper_admin
//       WHERE sad_email = @email OR sad_username = @username
//     `);

//     if (duplicateCheck.recordset.length > 0) {
//       return res.status(409).json({ message: 'Email or username already exists.' });
//     }

//     // Insert new Super Admin
//     const insertRequest = pool.request();
//     insertRequest.input('name', sql.VarChar(100), name);
//     insertRequest.input('email', sql.VarChar(100), email);
//     insertRequest.input('username', sql.VarChar(50), username);
//     insertRequest.input('phone', sql.VarChar(15), phone);
//     insertRequest.input('location', sql.VarChar(100), location);
//     insertRequest.input('password', sql.VarChar(100), password); // TODO: hash password in real systems

//     await insertRequest.query(`
//       INSERT INTO supper_admin (
//         sad_names, sad_email, sad_username, sad_phone, sad_loc, sad_pass
//       ) VALUES (
//         @name, @email, @username, @phone, @location, @password
//       )
//     `);

//     res.status(200).json({ message: 'Registration successful.' });

//   } catch (error) {
//     console.error('🛑 Registration Error:', error);
//     res.status(500).json({ message: error.message || 'Server error during registration.' });
//   }
// });



// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  await poolConnect;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: '📧 Email is required.' });
  }

  try {
    // 1. Find user by email
    const request = pool.request();
    request.input('email', sql.VarChar, email);
    const result = await request.query(`
      SELECT TOP 1 sad_id, sad_names FROM supper_admin WHERE sad_email = @email
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: '❌ No user found with this email address.' });
    }

    const user = result.recordset[0];

    // 2. Generate token and timestamps
    let token;
    try {
      token = crypto.randomBytes(32).toString('hex');
    } catch (cryptoErr) {
      console.error('🔐 Token generation error:', cryptoErr);
      return res.status(500).json({ error: 'Failed to generate reset token.' });
    }

    const now = moment().tz(KIGALI_TZ);
    const createdAt = now.format('YYYY-MM-DD HH:mm:ss');
    const expiresAt = now.clone().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');

    // 3. Insert password reset record
    try {
      const insertReq = pool.request();
      insertReq.input('sad_id', sql.Int, user.sad_id);
      insertReq.input('token', sql.VarChar, token);
      insertReq.input('created_at', sql.DateTime, createdAt);
      insertReq.input('expires_at', sql.DateTime, expiresAt);

      await insertReq.query(`
        INSERT INTO password_resets (sad_id, token, created_at, expires_at)
        VALUES (@sad_id, @token, @created_at, @expires_at)
      `);
    } catch (insertErr) {
      console.error('💾 Database insert error:', insertErr);
      return res.status(500).json({ error: 'Failed to save password reset request.' });
    }

    // 4. Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"IKIMINA MANAGEMENT SYSTEM" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Instructions',
      html: `
        <p>Hi ${user.sad_names},</p>
        <p>You requested a password reset. Click below to set a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error('📧 Email send error:', mailErr);
      return res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
    }

    // 5. Success response
    res.status(200).json({ message: '✅ Password reset email sent successfully. Please check your inbox.' });

  } catch (err) {
    console.error('🔥 Unexpected forgot-password error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during password reset.' });
  }
});



// VALIDATE TOKEN
router.get('/reset-password/:token', async (req, res) => {
  await poolConnect;
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: '🔑 Token is required in the URL.' });
  }

  try {
    const request = pool.request();
    request.input('token', sql.VarChar, token);
    const result = await request.query(`
      SELECT TOP 1 sad_id, expires_at FROM password_resets
      WHERE token = @token
      ORDER BY created_at DESC
    `);

    const row = result.recordset[0];
    if (!row) {
      return res.status(404).json({ error: '❌ Token not found or invalid.' });
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: '⏰ Token has expired. Please request a new reset.' });
    }

    res.status(200).json({ userId: row.sad_id });

  } catch (err) {
    console.error('❗ Validate token error:', err);
    res.status(500).json({ error: 'Server error while validating token.' });
  }
});



// RESET PASSWORD
router.post('/reset-password/:token', async (req, res) => {
  await poolConnect;
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token) {
    return res.status(400).json({ error: '🔑 Token is required in the URL.' });
  }

  if (!newPassword) {
    return res.status(400).json({ error: '🔐 New password is required.' });
  }

  try {
    // 1. Lookup token
    const tokenReq = pool.request();
    tokenReq.input('token', sql.VarChar, token);
    const result = await tokenReq.query(`
      SELECT TOP 1 sad_id, expires_at FROM password_resets
      WHERE token = @token
      ORDER BY created_at DESC
    `);

    const row = result.recordset[0];
    if (!row) {
      return res.status(404).json({ error: '❌ Reset token is invalid or not found.' });
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: '⏰ Reset token has expired. Please request a new one.' });
    }

    // 2. Hash new password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    } catch (hashErr) {
      console.error('🔒 Password hash error:', hashErr);
      return res.status(500).json({ error: 'Failed to process password.' });
    }

    // 3. Update password
    try {
      const updateReq = pool.request();
      updateReq.input('password', sql.VarChar, hashedPassword);
      updateReq.input('sad_id', sql.Int, row.sad_id);
      await updateReq.query(`
        UPDATE supper_admin SET sad_pass = @password WHERE sad_id = @sad_id
      `);
    } catch (updateErr) {
      console.error('✏️ Password update error:', updateErr);
      return res.status(500).json({ error: 'Failed to update password in database.' });
    }

    // 4. Delete used token
    try {
      const deleteReq = pool.request();
      deleteReq.input('token', sql.VarChar, token);
      await deleteReq.query(`DELETE FROM password_resets WHERE token = @token`);
    } catch (deleteErr) {
      console.warn('⚠️ Token cleanup failed (non-critical):', deleteErr);
    }

    res.status(200).json({ message: '✅ Password has been reset successfully.' });

  } catch (err) {
    console.error('🔥 Reset password unexpected error:', err);
    res.status(500).json({ error: 'Unexpected server error during password reset.' });
  }
});



// ✅ UPDATED: Update User
router.put('/users/:id', async (req, res) => {
  await poolConnect;
  const sad_id = req.params.id;
  const { sad_names, sad_email, sad_username, sad_phone } = req.body;

  try {
    const checkReq = pool.request();
    checkReq.input('email', sql.VarChar, sad_email);
    checkReq.input('username', sql.VarChar, sad_username);
    checkReq.input('phone', sql.VarChar, sad_phone);
    checkReq.input('sad_id', sql.Int, sad_id);
    const check = await checkReq.query(`
      SELECT sad_id FROM supper_admin
      WHERE (sad_email = @email OR sad_username = @username OR sad_phone = @phone)
        AND sad_id != @sad_id
    `);

    if (check.recordset.length > 0)
      return res.status(400).json({ error: 'Email, username, or phone already in use.' });

    const fields = [];
    const inputs = [];

    if (sad_names) {
      fields.push('sad_names = @names');
      inputs.push({ name: 'names', type: sql.VarChar, value: sad_names });
    }
    if (sad_email) {
      fields.push('sad_email = @email');
      inputs.push({ name: 'email', type: sql.VarChar, value: sad_email });
    }
    if (sad_username) {
      fields.push('sad_username = @username');
      inputs.push({ name: 'username', type: sql.VarChar, value: sad_username });
    }
    if (sad_phone) {
      fields.push('sad_phone = @phone');
      inputs.push({ name: 'phone', type: sql.VarChar, value: sad_phone });
    }

    if (fields.length === 0)
      return res.status(400).json({ error: 'No fields provided to update' });

    const updateReq = pool.request();
    inputs.forEach(i => updateReq.input(i.name, i.type, i.value));
    updateReq.input('sad_id', sql.Int, sad_id);
    const sqlUpdate = `UPDATE supper_admin SET ${fields.join(', ')} WHERE sad_id = @sad_id`;
    const result = await updateReq.query(sqlUpdate);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ error: 'User not found' });

    const fetchReq = pool.request();
    fetchReq.input('sad_id', sql.Int, sad_id);
    const userResult = await fetchReq.query(`
      SELECT sad_id, sad_names, sad_email, sad_username, sad_phone FROM supper_admin WHERE sad_id = @sad_id
    `);

    res.json({ user: userResult.recordset[0] });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});



module.exports = router;
