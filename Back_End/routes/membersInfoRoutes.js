require('dotenv').config();
const express = require('express');
const router = express.Router();
const { sql, poolConnect, pool } = require('../config/db');


const { sendSms, sendCustomSms, sendEmail, sendCustomEmail } = require('../routes/notification');

// Helper: Validate ownership of member by iki_id
async function checkOwnership(member_id, iki_id) {
  const result = await pool.request()
    .input('member_id', member_id)
    .input('iki_id', iki_id)
    .query('SELECT 1 FROM members_info WHERE member_id = @member_id AND iki_id = @iki_id');
  return result.recordset.length > 0;
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
    const result = await pool.request()
      .input('iki_id', iki_id)
      .query(`
        SELECT mi.member_id, mi.member_names, mi.member_Nid, mi.gm_Nid, mi.member_phone_number, 
               mi.member_email, mi.member_type_id, mi.iki_id,
               mt.member_type, ik.iki_name,
               mai.member_code
        FROM members_info mi
        LEFT JOIN member_type_info mt ON mi.member_type_id = mt.member_type_id
        LEFT JOIN ikimina_info ik ON mi.iki_id = ik.iki_id
        LEFT JOIN member_access_info mai ON mi.member_id = mai.member_id
        WHERE mi.iki_id = @iki_id
      `);

    return res.json({
      success: true,
      data: result.recordset,
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
    const result = await pool.request()
      .input('member_id', member_id)
      .query(`
        SELECT m.*, i.iki_name, mt.member_type, ma.member_code, ma.member_pass
        FROM members_info m
        LEFT JOIN ikimina_info i ON m.iki_id = i.iki_id
        LEFT JOIN member_type_info mt ON m.member_type_id = mt.member_type_id
        LEFT JOIN member_access_info ma ON m.member_id = ma.member_id
        WHERE m.member_id = @member_id
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'Member not found.' });

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error('Error fetching member:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Helper to get latest round status
const getLatestRoundStatus = async (iki_id) => {
  const result = await pool.request()
    .input('iki_id', iki_id)
    .query(`
      SELECT TOP 1 round_status FROM ikimina_rounds 
      WHERE iki_id = @iki_id 
      ORDER BY round_number DESC
    `);
  if (result.recordset.length === 0) {
    console.log(`No rounds found for ikimina ID: ${iki_id}. Setting member as inactive.`);
    return 'inactive';
  }
  return result.recordset[0].round_status === 'active' ? 'active' : 'inactive';
};

// Helper to compose location string
function composeLocation(data) {
  return [data.cell, data.village, data.sector].filter(Boolean).join(', ');
}

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

  // Validation
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
    await poolConnect;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);

      // Check if phone or NID already registered in this Ikimina
      request.input('member_phone_number', sql.VarChar(50), member_phone_number);
      request.input('member_Nid', sql.VarChar(50), member_Nid);
      request.input('iki_id', sql.Int, parseInt(iki_id));

      const existsResult = await request.query(`
        SELECT 1 FROM members_info
        WHERE (member_phone_number = @member_phone_number OR member_Nid = @member_Nid)
          AND iki_id = @iki_id
      `);

      if (existsResult.recordset.length > 0) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: 'Phone or National ID already registered in your Ikimina.',
        });
      }

      // Get member types
      const typesResult = await pool.request().query('SELECT member_type_id, member_type FROM member_type_info');
      const types = typesResult.recordset;
      const currentTypeObj = types.find(t => t.member_type_id.toString() === member_type_id.toString());

      if (!currentTypeObj) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid member_type_id provided.',
        });
      }

      // Unique roles check (except for "member")
      if (currentTypeObj.member_type.toLowerCase() !== 'member') {
        const conflictsRequest = new sql.Request(transaction);
        conflictsRequest.input('member_type_id', sql.Int, parseInt(member_type_id));
        conflictsRequest.input('iki_id', sql.Int, parseInt(iki_id));
        const conflictsResult = await conflictsRequest.query(`
          SELECT 1 FROM members_info
          WHERE member_type_id = @member_type_id AND iki_id = @iki_id
        `);

        if (conflictsResult.recordset.length > 0) {
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: `A member with the role '${currentTypeObj.member_type}' already exists in your Ikimina group.`,
          });
        }
      }

      // Insert new member
      const insertRequest = new sql.Request(transaction);
      insertRequest.input('member_names', sql.VarChar(255), member_names);
      insertRequest.input('member_Nid', sql.VarChar(50), member_Nid || null);
      insertRequest.input('gm_Nid', sql.VarChar(50), gm_Nid || null);
      insertRequest.input('member_phone_number', sql.VarChar(50), member_phone_number);
      insertRequest.input('member_email', sql.VarChar(255), member_email || null);
      insertRequest.input('member_type_id', sql.Int, parseInt(member_type_id));
      insertRequest.input('iki_id', sql.Int, parseInt(iki_id));

      const insertResult = await insertRequest.query(`
        INSERT INTO members_info 
          (member_names, member_Nid, gm_Nid, member_phone_number, member_email, member_type_id, iki_id)
        OUTPUT INSERTED.member_id
        VALUES (@member_names, @member_Nid, @gm_Nid, @member_phone_number, @member_email, @member_type_id, @iki_id)
      `);

      const member_id = insertResult.recordset[0].member_id;
      const prefix = iki_id.toString().padStart(2, '0');

      // Get latest member_code with prefix
      const codeRequest = new sql.Request(transaction);
      codeRequest.input('prefix', sql.VarChar(10), prefix + '%');

      const latestCodeResult = await codeRequest.query(`
        SELECT TOP 1 member_code FROM member_access_info
        WHERE member_code LIKE @prefix
        ORDER BY member_code DESC
      `);

      let nextSuffix = 1;
      if (latestCodeResult.recordset.length > 0) {
        const lastCode = latestCodeResult.recordset[0].member_code;
        const lastSuffix = parseInt(lastCode.slice(-3), 10);
        if (!isNaN(lastSuffix)) nextSuffix = lastSuffix + 1;
      }

      const suffix = nextSuffix.toString().padStart(3, '0');
      const member_code = prefix + suffix;
      const member_pass = Math.floor(10000 + Math.random() * 90000).toString();

      // Insert access info
      const accessRequest = new sql.Request(transaction);
      accessRequest.input('member_id', sql.Int, member_id);
      accessRequest.input('member_code', sql.VarChar(10), member_code);
      accessRequest.input('member_pass', sql.VarChar(10), member_pass);

      await accessRequest.query(`
        INSERT INTO member_access_info (member_id, member_code, member_pass)
        VALUES (@member_id, @member_code, @member_pass)
      `);

      await transaction.commit();

      // Compose location
      const location = [cell, village, sector].filter(Boolean).join(', ');

      // Send SMS and Email (your implementations)
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
      if (smsSent && emailSent) sendMessage += 'Credentials sent via SMS and Email.';
      else if (smsSent) sendMessage += 'Credentials sent via SMS.';
      else if (emailSent) sendMessage += 'Credentials sent via Email.';
      else sendMessage += 'Failed to send credentials via SMS and Email.';

      return res.status(201).json({
        success: true,
        message: sendMessage,
        data: { member_code, member_pass, member_phone_number, member_email },
      });
    } catch (err) {
      await transaction.rollback();
      console.error('Registration error:', err);
      return res.status(500).json({ success: false, message: 'Server error during member registration.' });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Unexpected server error.' });
  }
});

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

  // Validation
  if (!member_names || !member_type_id || !iki_id) {
    return res.status(400).json({ success: false, message: 'Required fields missing.' });
  }
  if ((!member_Nid || !member_Nid.trim()) && (!gm_Nid || !gm_Nid.trim())) {
    return res.status(400).json({ success: false, message: 'Either National ID or Guardian NID must be provided.' });
  }

  try {
    await poolConnect;
    const request = pool.request();

    request.input('member_id', sql.Int, parseInt(member_id));
    request.input('iki_id', sql.Int, parseInt(iki_id));

    const rowsResult = await request.query(`
      SELECT m.member_names, m.member_Nid, m.gm_Nid, m.member_phone_number, m.member_email, m.member_type_id,
             i.iki_name, l.cell, l.village, l.sector
      FROM members_info m
      LEFT JOIN ikimina_info i ON m.iki_id = i.iki_id
      LEFT JOIN ikimina_locations l ON i.location_id = l.location_id
      WHERE m.member_id = @member_id AND m.iki_id = @iki_id
    `);

    if (rowsResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const oldData = rowsResult.recordset[0];
    const ikiminaName = oldData.iki_name || 'Unknown';
    const location = composeLocation(oldData);

    // Fetch member types
    const memberTypesResult = await pool.request().query('SELECT member_type_id, member_type FROM member_type_info');
    const memberTypeMap = {};
    memberTypesResult.recordset.forEach(mt => {
      memberTypeMap[mt.member_type_id] = mt.member_type;
    });

    const newRole = memberTypeMap[member_type_id]?.toLowerCase();
    const oldRole = memberTypeMap[oldData.member_type_id]?.toLowerCase();

    if (newRole !== 'member' && newRole !== oldRole) {
      const roleCheckRequest = pool.request();
      roleCheckRequest.input('member_type_id', sql.Int, parseInt(member_type_id));
      roleCheckRequest.input('iki_id', sql.Int, parseInt(iki_id));
      roleCheckRequest.input('member_id', sql.Int, parseInt(member_id));

      const roleCheckResult = await roleCheckRequest.query(`
        SELECT 1 FROM members_info
        WHERE member_type_id = @member_type_id AND iki_id = @iki_id AND member_id != @member_id
      `);

      if (roleCheckResult.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: `A member with the role '${memberTypeMap[member_type_id]}' already exists in your Ikimina group.`,
        });
      }
    }

    // Update member
    const updateRequest = pool.request();
    updateRequest.input('member_names', sql.VarChar(255), member_names);
    updateRequest.input('member_Nid', sql.VarChar(50), member_Nid?.trim() || null);
    updateRequest.input('gm_Nid', sql.VarChar(50), gm_Nid?.trim() || null);
    updateRequest.input('member_phone_number', sql.VarChar(50), member_phone_number);
    updateRequest.input('member_email', sql.VarChar(255), member_email?.trim() || null);
    updateRequest.input('member_type_id', sql.Int, parseInt(member_type_id));
    updateRequest.input('member_id', sql.Int, parseInt(member_id));
    updateRequest.input('iki_id', sql.Int, parseInt(iki_id));

    const updateResult = await updateRequest.query(`
      UPDATE members_info SET
        member_names = @member_names,
        member_Nid = @member_Nid,
        gm_Nid = @gm_Nid,
        member_phone_number = @member_phone_number,
        member_email = @member_email,
        member_type_id = @member_type_id
      WHERE member_id = @member_id AND iki_id = @iki_id
    `);

    if (updateResult.rowsAffected[0] === 0) {
      return res.status(400).json({ success: false, message: 'No changes made.' });
    }

    // Check changes for notification
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

      if (key === 'member_type_id') {
        oldVal = memberTypeMap[oldVal] || `Unknown (${oldVal})`;
        newVal = memberTypeMap[newVal] || `Unknown (${newVal})`;
      }

      if ((oldVal || '') !== (newVal || '')) {
        changes.push(`${fieldsToCheck[key]} changed from "${oldVal || '—'}" to "${newVal || '—'}"`);
      }
    }

    // Get credentials for notification
    const accessRequest = pool.request();
    accessRequest.input('member_id', sql.Int, parseInt(member_id));
    const accessResult = await accessRequest.query(`
      SELECT member_code, member_pass FROM member_access_info WHERE member_id = @member_id
    `);
    const credentials = accessResult.recordset[0] || { member_code: null, member_pass: null };

    // Compose message
    let htmlMsg = `Hello ${member_names}, your information in Ikimina <strong>${ikiminaName}</strong> has been updated.<br/><br/>`;
    if (changes.length) {
      htmlMsg += 'Changes made:<br/><ul><li>' + changes.join('</li><li>') + '</li></ul><br/>';
    }
    htmlMsg += `Location: ${location}<br/><br/>Access Credentials:<br/><strong>Code:</strong> ${credentials.member_code}<br/><strong>Password:</strong> ${credentials.member_pass}`;

    const smsMsg = htmlMsg.replace(/<br\/>/g, '\n').replace(/<[^>]+>/g, '');

    if (member_phone_number) sendCustomSms(member_phone_number, smsMsg).catch(console.error);
    if (member_email) sendCustomEmail(member_email, `Info Updated - ${ikiminaName}`, htmlMsg).catch(console.error);

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
    console.error('Error updating member:', err);
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

    const deleteResult = await pool.request()
      .input('member_id', member_id)
      .input('iki_id', iki_id)
      .query('DELETE FROM members_info WHERE member_id = @member_id AND iki_id = @iki_id');

    if (deleteResult.rowsAffected[0] === 0) {
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
