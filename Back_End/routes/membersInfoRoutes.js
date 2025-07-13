require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Twilio setup
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper: Validate ownership of member by iki_id
async function checkOwnership(member_id, iki_id) {
  const [rows] = await db.execute(
    'SELECT 1 FROM members_info WHERE member_id = ? AND iki_id = ?',
    [member_id, iki_id]
  );
  return rows.length > 0;
}

// Helper: Send SMS via Twilio
async function sendSms(phone, code, pass) {
  return client.messages.create({
    body: `Your member credentials:\nCode: ${code}\nPassword: ${pass}`,
    from: twilioPhone,
    to: phone,
  });
}

// Helper: Compose location string
function composeLocation({ cell, village, sector }) {
  return `Cell: ${cell || 'N/A'}, Village: ${village || 'N/A'}, Sector: ${sector || 'N/A'}`;
}

// Helper: Send Email via Nodemailer
async function sendEmail(email, code, pass, name, iki_name, location) {
  const mailOptions = {
    from: `"Ikimina Management System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Member Access Credentials',
    html: `
      <p>Hello ${name},</p>
      <p>Your registration on Ikimina <strong>${iki_name}</strong> located at <strong>${location}</strong> has been successful.</p>
      <p>Your member credentials are:</p>
      <ul>
        <li><strong>Code:</strong> ${code}</li>
        <li><strong>Password:</strong> ${pass}</li>
      </ul>
      <p>Please keep them safe.</p>
      <br/>
      <p>– Manage your Savings, reports and finances</p>
    `,
  };
  return transporter.sendMail(mailOptions);
}

// GET all members for an iki_id
router.get('/select', async (req, res) => {
  const { iki_id } = req.query;

  if (!iki_id) {
    return res.status(400).json({
      success: false,
      message: 'iki_id query parameter is required.',
    });
  }

  try {
    const [rows] = await db.execute(
      `
      SELECT mi.member_id, mi.member_names, mi.member_Nid, mi.gm_Nid, mi.member_phone_number, 
             mi.member_email, mi.member_type_id, mi.iki_id,
             mt.member_type, ik.iki_name,
             mai.member_code
      FROM members_info mi
      LEFT JOIN member_type_info mt ON mi.member_type_id = mt.member_type_id
      LEFT JOIN ikimina_info ik ON mi.iki_id = ik.iki_id
      LEFT JOIN member_access_info mai ON mi.member_id = mai.member_id
      WHERE mi.iki_id = ?
      `,
      [iki_id]
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching members_info:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error while fetching members.',
    });
  }
});

// POST register new member
router.post('/newMember', async (req, res) => {
  const {
    member_names,
    member_Nid,
    gm_Nid,
    member_phone_number,
    member_email,
    member_type_id,
    iki_id,
    iki_name,
    cell,
    village,
    sector,
  } = req.body;

  const missingFields = [];
  if (!member_names) missingFields.push('member_names');
  if (!member_Nid && !gm_Nid) missingFields.push('member_Nid or gm_Nid');
  if (!member_phone_number) missingFields.push('member_phone_number');
  if (!member_type_id) missingFields.push('member_type_id');
  if (!iki_id) missingFields.push('iki_id');
  if (!iki_name) missingFields.push('iki_name');
  if (!cell) missingFields.push('cell');
  if (!village) missingFields.push('village');
  if (!sector) missingFields.push('sector');

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Required fields are missing: ${missingFields.join(', ')}.`,
    });
  }

  try {
    // Check if phone or NID already registered in this iki_id
    const [exists] = await db.execute(
      'SELECT 1 FROM members_info WHERE (member_phone_number = ? OR member_Nid = ?) AND iki_id = ?',
      [member_phone_number, member_Nid, iki_id]
    );
    if (exists.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Phone or National ID already registered in your Ikimina.',
      });
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // Insert member info (location not saved here)
      const [result] = await conn.execute(
        `INSERT INTO members_info 
          (member_names, member_Nid, gm_Nid, member_phone_number, member_email, member_type_id, iki_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          member_names,
          member_Nid || null,
          gm_Nid || null,
          member_phone_number,
          member_email || null,
          member_type_id,
          iki_id,
        ]
      );

      const member_id = result.insertId;

      // Generate member_code with iki_id prefix + sequential suffix
      const prefix = iki_id.toString().padStart(2, '0');

      const [latestCodeRows] = await conn.execute(
        `SELECT member_code FROM member_access_info
         WHERE member_code LIKE CONCAT(?, '%')
         ORDER BY member_code DESC LIMIT 1`,
        [prefix]
      );

      let nextSuffix = 1;
      if (latestCodeRows.length > 0) {
        const lastCode = latestCodeRows[0].member_code;
        const lastSuffix = parseInt(lastCode.slice(-3), 10);
        if (!isNaN(lastSuffix)) {
          nextSuffix = lastSuffix + 1;
        }
      }
      const suffix = nextSuffix.toString().padStart(3, '0');
      const member_code = prefix + suffix;

      // Generate random 5-digit password
      const member_pass = Math.floor(10000 + Math.random() * 90000).toString();

      await conn.execute(
        `INSERT INTO member_access_info (member_id, member_code, member_pass)
         VALUES (?, ?, ?)`,
        [member_id, member_code, member_pass]
      );

      await conn.commit();

      // Compose location string for messages
      const location = composeLocation({ cell, village, sector });

      // Send SMS and Email notifications (do not block response)
      let smsSent = false;
      let emailSent = false;

      try {
        await sendSms(member_phone_number, member_code, member_pass);
        smsSent = true;
      } catch (smsErr) {
        console.error('SMS sending error:', smsErr);
      }

      if (member_email) {
        try {
          await sendEmail(member_email, member_code, member_pass, member_names, iki_name, location);
          emailSent = true;
        } catch (emailErr) {
          console.error('Email sending error:', emailErr);
        }
      }

      let sendMessage = 'Member registered successfully. ';
      if (smsSent && emailSent) {
        sendMessage += 'Credentials sent via SMS and Email.';
      } else if (smsSent) {
        sendMessage += 'Credentials sent via SMS.';
      } else if (emailSent) {
        sendMessage += 'Credentials sent via Email.';
      } else {
        sendMessage += 'Failed to send credentials via SMS and Email.';
      }



      return res.status(201).json({
        success: true,
        message: sendMessage,
        data: {
          member_code,
          member_pass,
          member_phone_number,
          member_email,
        },
      });


    } catch (err) {
      await conn.rollback();
      console.error('Registration error:', err);
      return res.status(500).json({ success: false, message: 'Server error during member registration.' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Unexpected server error.' });
  }
});

// POST resend email
router.post('/resend-email', async (req, res) => {
  const { email, phone, iki_id } = req.body;

  if (!email || !phone || !iki_id) {
    return res.status(400).json({ success: false, message: 'Email, phone, and iki_id are required.' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT mai.member_code, mai.member_pass, mi.member_names
       FROM member_access_info mai
       JOIN members_info mi ON mai.member_id = mi.member_id
       WHERE mi.member_email = ? AND mi.member_phone_number = ? AND mi.iki_id = ?
       ORDER BY mai.maccess_id DESC LIMIT 1`,
      [email, phone, iki_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No member found with this email and phone in your Ikimina.' });
    }

    const { member_code, member_pass, member_names } = rows[0];
    const location = req.body.location || 'your area';

    await sendEmail(email, member_code, member_pass, member_names, req.body.iki_name || 'Ikimina', location);

    res.status(200).json({ success: true, message: 'Email resent successfully.' });
  } catch (err) {
    console.error('Resend Email error:', err);
    res.status(500).json({ success: false, message: 'Failed to resend email.' });
  }
});

// POST resend SMS
router.post('/resend-sms', async (req, res) => {
  const { phone, iki_id } = req.body;

  if (!phone || !iki_id)
    return res.status(400).json({ success: false, message: 'Phone number and iki_id are required.' });

  try {
    const [rows] = await db.execute(
      `SELECT mai.member_code, mai.member_pass FROM member_access_info mai
       JOIN members_info mi ON mai.member_id = mi.member_id
       WHERE mi.member_phone_number = ? AND mi.iki_id = ?
       ORDER BY mai.maccess_id DESC LIMIT 1`,
      [phone, iki_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No member found with this phone in your Ikimina.' });
    }

    const { member_code, member_pass } = rows[0];
    await sendSms(phone, member_code, member_pass);

    res.json({ success: true, message: 'SMS resent successfully.', member_code, member_pass });
  } catch (err) {
    console.error('Resend SMS error:', err);
    res.status(500).json({ success: false, message: 'Failed to resend SMS.' });
  }
});

// PUT update member (ownership verified)
router.put('/:member_id', async (req, res) => {
  const { member_id } = req.params;
  const {
    member_names,
    member_Nid,
    gm_Nid,
    member_phone_number,
    member_email,
    member_type_id,
    iki_id,
  } = req.body;

  if (!member_names || !member_type_id || !iki_id) {
    return res
      .status(400)
      .json({ success: false, message: 'Required fields missing: member_names, member_type_id, iki_id.' });
  }

  if (!(await checkOwnership(member_id, iki_id))) {
    return res.status(403).json({ success: false, message: 'Unauthorized: Member does not belong to you.' });
  }

  try {
    const [result] = await db.execute(
      `UPDATE members_info SET
        member_names = ?,
        member_Nid = ?,
        gm_Nid = ?,
        member_phone_number = ?,
        member_email = ?,
        member_type_id = ?
      WHERE member_id = ? AND iki_id = ?`,
      [member_names, member_Nid || null, gm_Nid || null, member_phone_number, member_email || null, member_type_id, member_id, iki_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    res.status(200).json({ success: true, message: 'Member updated successfully.' });
  } catch (error) {
    console.error('Error updating member_info:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error while updating member.' });
  }
});

// DELETE member (ownership verified)
router.delete('/:member_id', async (req, res) => {
  const { member_id } = req.params;
  const { iki_id } = req.body;

  if (!iki_id) {
    return res.status(400).json({ success: false, message: 'iki_id is required for authorization.' });
  }

  if (!(await checkOwnership(member_id, iki_id))) {
    return res.status(403).json({ success: false, message: 'Unauthorized: Member does not belong to you.' });
  }

  try {
    const [result] = await db.execute('DELETE FROM members_info WHERE member_id = ? AND iki_id = ?', [
      member_id,
      iki_id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Member not found or unauthorized.' });
    }
    res.status(200).json({ success: true, message: 'Member deleted successfully.' });
  } catch (error) {
    console.error('Error deleting member_info:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error while deleting member.' });
  }
});

module.exports = router;
