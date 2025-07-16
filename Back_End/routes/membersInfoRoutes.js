require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../config/db');

const { sendSms, sendCustomSms, sendEmail, sendCustomEmail } = require('../routes/notification');
// Helper: Validate ownership of member by iki_id
async function checkOwnership(member_id, iki_id) {
  const [rows] = await db.execute(
    'SELECT 1 FROM members_info WHERE member_id = ? AND iki_id = ?',
    [member_id, iki_id]
  );
  return rows.length > 0;
}

// Helper: Compose location string
function composeLocation({ cell, village, sector }) {
  return `Cell: ${cell || 'N/A'}, Village: ${village || 'N/A'}, Sector: ${sector || 'N/A'}`;
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

// GET member info by ID
router.get('/select/:member_id', async (req, res) => {
  const { member_id } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT m.*, i.iki_name, mt.member_type, ma.member_code, ma.member_pass
       FROM members_info m
       LEFT JOIN ikimina_info i ON m.iki_id = i.iki_id
       LEFT JOIN member_type_info mt ON m.member_type_id = mt.member_type_id
       LEFT JOIN member_access_info ma ON m.member_id = ma.member_id
       WHERE m.member_id = ? LIMIT 1`,
      [member_id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Member not found.' });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching member:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
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
  } = req.body;

  const iki_id = req.header('x-iki-id');
  const iki_name = req.header('x-iki-name');
  const cell = req.header('x-cell');
  const village = req.header('x-village');
  const sector = req.header('x-sector');

  const missingFields = [];
  if (!member_names) missingFields.push('member_names');
  if (!member_Nid && !gm_Nid) missingFields.push('Either member_Nid or gm_Nid');
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
      message: `Missing required fields: ${missingFields.join(', ')}.`,
    });
  }

  try {
    // Check if phone or NID already registered
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

    const [types] = await db.execute('SELECT member_type_id, member_type FROM member_type_info');
    const currentTypeObj = types.find(t => t.member_type_id.toString() === member_type_id.toString());

    if (!currentTypeObj) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member_type_id provided.',
      });
    }

    if (currentTypeObj.member_type.toLowerCase() !== 'member') {
      const [conflicts] = await db.execute(
        `SELECT 1 FROM members_info WHERE member_type_id = ? AND iki_id = ?`,
        [member_type_id, iki_id]
      );
      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: `A member with the role '${currentTypeObj.member_type}' already exists in your Ikimina group.`,
        });
      }
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
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

      const member_pass = Math.floor(10000 + Math.random() * 90000).toString();

      await conn.execute(
        `INSERT INTO member_access_info (member_id, member_code, member_pass)
         VALUES (?, ?, ?)`,
        [member_id, member_code, member_pass]
      );

      await conn.commit();

      // Compose location string
      const location = [cell, village, sector].filter(Boolean).join(', ');

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
      console.error('Registration error (inner):', err);
      return res.status(500).json({ success: false, message: 'Server error during member registration.' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Unexpected server error.' });
  }
});



// PUT update member
router.put('/update/:member_id', async (req, res) => {
  const { member_id } = req.params;
  const iki_id = req.header('x-iki-id');
  const {
    member_names,
    member_Nid,
    gm_Nid,
    member_phone_number,
    member_email,
    member_type_id,
  } = req.body;

  if (!member_names || !member_type_id || !iki_id) {
    return res.status(400).json({ success: false, message: 'Required fields missing.' });
  }

  if ((!member_Nid || !member_Nid.trim()) && (!gm_Nid || !gm_Nid.trim())) {
    return res.status(400).json({ success: false, message: 'Either National ID or Guardian NID must be provided.' });
  }

  try {
    // Fetch existing member data + ikimina info + location info
    const [rows] = await db.execute(
      `SELECT m.member_names, m.member_Nid, m.gm_Nid, m.member_phone_number, m.member_email, m.member_type_id,
              i.iki_name, l.cell, l.village, l.sector
       FROM members_info m
       LEFT JOIN ikimina_info i ON m.iki_id = i.iki_id
       LEFT JOIN ikimina_locations l ON i.iki_location = l.location_id
       WHERE m.member_id = ? AND m.iki_id = ? LIMIT 1`,
      [member_id, iki_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const oldData = rows[0];
    const ikiminaName = oldData.iki_name || 'Unknown';
    const location = composeLocation(oldData);

    // Fetch all member types from DB for id => name mapping
    const [memberTypesRows] = await db.execute('SELECT member_type_id, member_type FROM member_type_info');
    const memberTypeMap = {};
    memberTypesRows.forEach(mt => {
      memberTypeMap[mt.member_type_id] = mt.member_type;
    });

    // Perform the update
    const [result] = await db.execute(
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
        member_Nid?.trim() || null,
        gm_Nid?.trim() || null,
        member_phone_number,
        member_email?.trim() || null,
        member_type_id,
        member_id,
        iki_id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, message: 'No changes made.' });
    }

    // Compose changes array with friendly member type names
    const changes = [];
    const fieldsToCheck = {
      member_names: 'Full Name',
      member_Nid: 'National ID',
      gm_Nid: 'Guardian NID',
      member_phone_number: 'Phone Number',
      member_email: 'Email',
      member_type_id: 'Member Type',
    };

    for (const key of Object.keys(fieldsToCheck)) {
      let oldVal = oldData[key] ?? '';
      let newVal = (key in req.body ? req.body[key] ?? '' : '');

      // Map member_type_id to human-readable string
      if (key === 'member_type_id') {
        oldVal = memberTypeMap[oldVal] || `Unknown (${oldVal})`;
        newVal = memberTypeMap[newVal] || `Unknown (${newVal})`;
      }

      if ((oldVal || '') !== (newVal || '')) {
        changes.push(`${fieldsToCheck[key]} changed from "${oldVal || '—'}" to "${newVal || '—'}"`);
      }
    }

    // Get member credentials for notification
    const [accessRows] = await db.execute(
      `SELECT member_code, member_pass FROM member_access_info WHERE member_id = ? LIMIT 1`,
      [member_id]
    );
    const credentials = accessRows[0] || { member_code: null, member_pass: null };

    // Compose HTML email message with changes included
    let htmlMsg = `Hello ${member_names}, your information in Ikimina <strong>${ikiminaName}</strong> has been updated.<br/><br/>`;
    if (changes.length) {
      htmlMsg += 'Changes made:<br/><ul><li>' + changes.join('</li><li>') + '</li></ul><br/>';
    }
    htmlMsg += `Location: ${location}<br/><br/>Access Credentials:<br/><strong>Code:</strong> ${credentials.member_code}<br/><strong>Password:</strong> ${credentials.member_pass}`;

    // Compose SMS message without HTML tags
    const smsMsg = htmlMsg.replace(/<br\/>/g, '\n').replace(/<[^>]+>/g, '');

    // Send SMS and email asynchronously, but don’t block response
    if (member_phone_number) sendCustomSms(member_phone_number, smsMsg).catch(console.error);
    if (member_email) sendCustomEmail(member_email, `Info Updated - ${ikiminaName}`, htmlMsg).catch(console.error);

    // Send success response with friendly info & changes
    return res.status(200).json({
      success: true,
      message: 'Member updated successfully.',
      data: {
        ...credentials,
        changes,
        location,
        member_names,
        ikiminaName,
        member_phone_number,
        member_email,
      },
    });

  } catch (err) {
    console.error('Error updating member_info:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});



// DELETE member by ID (ownership verified)
router.delete('/delete/:member_id', async (req, res) => {
  const { member_id } = req.params;
  const iki_id = req.header('x-iki-id');

  if (!iki_id) {
    return res.status(400).json({
      success: false,
      message: 'iki_id header is required.',
    });
  }

  try {
    const owns = await checkOwnership(member_id, iki_id);
    if (!owns) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Member does not belong to you.',
      });
    }

    const [result] = await db.execute('DELETE FROM members_info WHERE member_id = ? AND iki_id = ?', [
      member_id,
      iki_id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found or already deleted.',
      });
    }

    return res.json({
      success: true,
      message: 'Member deleted successfully.',
    });
  } catch (err) {
    console.error('Error deleting member:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting member.',
    });
  }
});

module.exports = router;
