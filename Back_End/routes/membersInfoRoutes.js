require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Twilio setup
const accountSid  = process.env.TWILIO_SID;
const authToken   = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client      = twilio(accountSid, authToken);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Utility: build location string
function buildLocationString(sector, cell, village) {
  const parts = [];
  if (sector) parts.push(sector);
  if (cell) parts.push(cell);
  if (village) parts.push(village);
  return parts.length ? parts.join(', ') : '';
}

// Utility: format Rwandan phone numbers to E.164
function formatPhoneToE164(phone) {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('07')) return '+250' + trimmed.slice(1);
  return trimmed;
}

// Send SMS
async function sendSms(phone, code, pass, iki_name, sector, cell, village) {
  const formattedPhone = formatPhoneToE164(phone);
  const loc = buildLocationString(sector, cell, village);
  const msg = `Ikimina: ${iki_name}${loc ? ' (' + loc + ')' : ''}\n` +
              `Your Credentials:\nCode: ${code}\nPassword: ${pass}`;
  try {
    const result = await client.messages.create({
      body: msg,
      from: twilioPhone,
      to: formattedPhone
    });
    console.log('✅ SMS sent to', formattedPhone, 'SID:', result.sid);
    return result;
  } catch (err) {
    console.error('❌ SMS failed to', formattedPhone, '-', err.message);
    throw err;
  }
}

// Send Email
async function sendEmail(email, code, pass, name, iki_name, sector, cell, village) {
  const loc = buildLocationString(sector, cell, village);
  const mailOptions = {
    from: `"Ikimina Management System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Member Access Credentials',
    html: `
      <p>Hello ${name},</p>
      <p>Your registration on Ikimina <strong>${iki_name}</strong>
         ${loc ? `located in <strong>${loc}</strong>` : ''} has been successful.</p>
      <p>Your member credentials are:</p>
      <ul>
        <li><strong>Code:</strong> ${code}</li>
        <li><strong>Password:</strong> ${pass}</li>
      </ul>
      <p>Please keep them safe.</p>
      <br/>
      <p>– Manage your savings, reports and finances anytime.</p>
    `
  };
  return transporter.sendMail(mailOptions);
}

// Utility: validate if member belongs to this ikimina
async function checkOwnership(member_id, iki_id) {
  const [rows] = await db.execute(
    'SELECT 1 FROM members_info WHERE member_id = ? AND iki_id = ?',
    [member_id, iki_id]
  );
  return rows.length > 0;
}

// GET members by Ikimina
router.get('/selectByIkiId', async (req, res) => {
  const { iki_id } = req.query;
  if (!iki_id) {
    return res.status(400).json({ success: false, message: 'iki_id is required' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT mi.member_id,
              mi.member_names,
              mi.member_Nid,
              mi.gm_Nid,
              gm.gm_names AS guardian_name,
              mi.member_phone_number,
              mi.member_email,
              mi.member_type_id,
              mt.member_type,
              mai.member_code,
              ik.iki_name
       FROM members_info mi
       LEFT JOIN member_type_info mt ON mi.member_type_id = mt.member_type_id
       LEFT JOIN member_access_info mai ON mi.member_id = mai.member_id
       LEFT JOIN ikimina_info ik ON mi.iki_id = ik.iki_id
       LEFT JOIN gudian_members gm ON mi.gm_Nid = gm.gm_Nid
       WHERE mi.iki_id = ?
       ORDER BY mi.member_names`,
      [iki_id]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching members:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching members' });
  }
});



// GET: Members list for an ikimina
router.get('/select', async (req, res) => {
  const { iki_id } = req.query;
  if (!iki_id) return res.status(400).json({ success: false, message: 'iki_id is required.' });

  try {
    const [rows] = await db.execute(`
      SELECT mi.member_id,
             mi.member_names,
             mi.member_Nid,
             mi.gm_Nid,
             mi.member_phone_number,
             mi.member_email,
             mi.member_type_id,
             mt.member_type,
             ik.iki_name,
             gm.gm_names AS guardian_name
      FROM members_info mi
      LEFT JOIN member_type_info mt ON mi.member_type_id = mt.member_type_id
      LEFT JOIN ikimina_info     ik ON mi.iki_id = ik.iki_id
      LEFT JOIN gudian_members   gm ON mi.gm_Nid = gm.gm_Nid
      WHERE mi.iki_id = ?
    `, [iki_id]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching members.' });
  }
});

// POST: Register new member
router.post('/newMember', async (req, res) => {
  const {
    member_names, member_Nid, gm_Nid,
    member_phone_number, member_email,
    member_type_id, iki_id, iki_name,
    cell, village, sector
  } = req.body;

  if (!member_names || !(member_Nid || gm_Nid) ||
      !member_phone_number || !member_type_id || !iki_id || !iki_name) {
    return res.status(400).json({ success: false, message: 'Required fields missing.' });
  }

  try {
    const [exists] = await db.execute(
      `SELECT 1 FROM members_info
       WHERE iki_id = ?
         AND (member_phone_number = ? OR (member_Nid IS NOT NULL AND member_Nid = ?))`,
      [iki_id, member_phone_number, member_Nid || '']
    );
    if (exists.length) {
      return res.status(409).json({
        success: false,
        message: `Phone or National ID already registered in ${iki_name}.`
      });
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const [ins] = await conn.execute(
        `INSERT INTO members_info
         (member_names, member_Nid, gm_Nid, member_phone_number, member_email, member_type_id, iki_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          member_names,
          member_Nid || null,
          gm_Nid     || null,
          member_phone_number,
          member_email || null,
          member_type_id,
          iki_id
        ]
      );
      const member_id = ins.insertId;

      const prefix = iki_id.toString().padStart(2, '0');
      const [maxRow] = await conn.execute(
        `SELECT MAX(CAST(SUBSTRING(member_code, LENGTH(?)+1) AS UNSIGNED)) AS maxCode
         FROM member_access_info
         WHERE member_code LIKE CONCAT(?, '%')`,
        [prefix, prefix]
      );
      const nextNum = (maxRow[0].maxCode || 0) + 1;
      const member_code = prefix + nextNum.toString().padStart(3, '0');
      const member_pass = Math.floor(10000 + Math.random() * 90000).toString();

      await conn.execute(
        `INSERT INTO member_access_info (member_id, member_code, member_pass)
         VALUES (?, ?, ?)`,
        [member_id, member_code, member_pass]
      );

      await conn.commit();

      let smsSent = false, emailSent = false;
      try {
        await sendSms(member_phone_number, member_code, member_pass, iki_name, sector, cell, village);
        smsSent = true;
      } catch (e) {
        console.error('SMS error:', e.message);
      }

      if (member_email) {
        try {
          await sendEmail(member_email, member_code, member_pass, member_names, iki_name, sector, cell, village);
          emailSent = true;
        } catch (e) {
          console.error('Email error:', e.message);
        }
      }

      let msg = 'Member registered successfully. ';
      if (smsSent && emailSent) msg += 'Credentials sent via SMS & Email.';
      else if (smsSent) msg += 'Credentials sent via SMS.';
      else if (emailSent) msg += 'Credentials sent via Email.';
      else msg += 'Failed to send credentials.';

      return res.status(201).json({
        success: true,
        message: msg,
        member_code,
        member_pass,
        sentTo: {
          sms: smsSent ? formatPhoneToE164(member_phone_number) : null,
          email: emailSent ? member_email : null,
          location: buildLocationString(sector, cell, village)
        }
      });

    } catch (txErr) {
      await conn.rollback();
      console.error('Transaction error:', txErr);
      return res.status(500).json({ success: false, message: 'Error during registration.' });
    } finally {
      conn.release();
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT: Update member
router.put('/:member_id', async (req, res) => {
  const { member_id } = req.params;
  const {
    member_names, member_Nid, gm_Nid,
    member_phone_number, member_email,
    member_type_id, iki_id
  } = req.body;

  if (!member_names || !member_type_id || !iki_id) {
    return res.status(400).json({ success: false, message: 'Missing fields.' });
  }
  if (!member_phone_number) {
    return res.status(400).json({ success: false, message: 'Phone is required.' });
  }
  if (!(await checkOwnership(member_id, iki_id))) {
    return res.status(403).json({ success: false, message: 'Unauthorized.' });
  }

  try {
    const [exists] = await db.execute(
      `SELECT 1 FROM members_info
       WHERE iki_id = ?
         AND member_id != ?
         AND (member_phone_number = ? OR (member_Nid IS NOT NULL AND member_Nid = ?))`,
      [iki_id, member_id, member_phone_number, member_Nid || '']
    );
    if (exists.length) {
      return res.status(409).json({ success: false, message: 'Phone or NID used by another.' });
    }

    const finalGmNid = member_Nid ? null : gm_Nid || null;
    const finalMemberNid = member_Nid || null;

    const [upd] = await db.execute(
      `UPDATE members_info SET
         member_names = ?,
         member_Nid = ?,
         gm_Nid = ?,
         member_phone_number = ?,
         member_email = ?,
         member_type_id = ?
       WHERE member_id = ? AND iki_id = ?`,
      [
        member_names,
        finalMemberNid,
        finalGmNid,
        member_phone_number,
        member_email || null,
        member_type_id,
        member_id,
        iki_id
      ]
    );
    if (upd.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }
    res.json({ success: true, message: 'Member updated successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE: Remove member
router.delete('/:member_id', async (req, res) => {
  const { member_id } = req.params;
  const { iki_id } = req.body;
  if (!iki_id) {
    return res.status(400).json({ success: false, message: 'iki_id is required.' });
  }
  if (!(await checkOwnership(member_id, iki_id))) {
    return res.status(403).json({ success: false, message: 'Unauthorized.' });
  }
  try {
    const [del] = await db.execute(
      'DELETE FROM members_info WHERE member_id = ? AND iki_id = ?',
      [member_id, iki_id]
    );
    if (del.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }
    res.json({ success: true, message: 'Member deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
