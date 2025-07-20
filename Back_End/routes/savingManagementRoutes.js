const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');
const { sendCustomSms, sendCustomEmail } = require('./notification');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// Utility for SQL queries with parameters
async function runQuery(query, params = []) {
  await poolConnect;
  const request = pool.request();
  params.forEach(({ name, type, value }) => request.input(name, type, value));
  const result = await request.query(query);
  return result.recordset;
}

// Fetch member phone number by member_id
async function getMemberPhone(member_id) {
  const query = `
    SELECT member_phone_number
    FROM ims_db.dbo.members_info
    WHERE member_id = @member_id
  `;
  const result = await runQuery(query, [{ name: 'member_id', type: sql.Int, value: member_id }]);
  return result.length > 0 ? result[0].member_phone_number : null;
}
function formatSlotTime(slotTime) {
  if (!(slotTime instanceof Date)) return null;
  const h = slotTime.getUTCHours();
  const m = slotTime.getUTCMinutes();
  const s = slotTime.getUTCSeconds();
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

router.get('/memberSlots/:member_id/:iki_id', async (req, res) => {
  const { member_id, iki_id } = req.params;
  try {
    await poolConnect;
    const request = pool.request();
    request.input('member_id', sql.Int, member_id);
    request.input('iki_id', sql.Int, iki_id);

    const query = `
      SELECT 
        s.slot_id, s.iki_id, s.slot_date, s.slot_time, s.frequency_category, s.slot_status, s.created_at, s.round_id,
        r.round_number, r.round_year, r.start_date, r.end_date, r.round_status, r.number_of_categories,
        ISNULL(msa.save_id, 0) AS is_saved
      FROM ims_db.dbo.ikimina_saving_slots s
      INNER JOIN ims_db.dbo.ikimina_rounds r ON s.round_id = r.round_id
      LEFT JOIN ims_db.dbo.member_saving_activities msa ON msa.slot_id = s.slot_id AND msa.member_id = @member_id
      WHERE s.iki_id = @iki_id
      ORDER BY s.slot_date ASC, s.slot_time ASC
    `;

    const result = await request.query(query);
    const rawSlots = result.recordset;

    const now = dayjs().tz('Africa/Kigali');

    const processedSlots = rawSlots.map(slot => {
      // Format slot_date as YYYY-MM-DD
      const slotDate = slot.slot_date ? dayjs(slot.slot_date).format('YYYY-MM-DD') : null;

      // Format slot_time as HH:mm:ss in UTC
      let slotTimeStr = null;
      if (slot.slot_time) {
        if (typeof slot.slot_time === 'string') {
          slotTimeStr = slot.slot_time.length >= 8 ? slot.slot_time.substr(0, 8) : null;
        } else if (slot.slot_time instanceof Date) {
          slotTimeStr = dayjs(slot.slot_time).utc().format('HH:mm:ss');
        } else {
          slotTimeStr = null;
        }
      }

      // Combine date + time for status check
      let slotDateTime = null;
      if (slotDate && slotTimeStr) {
        slotDateTime = dayjs.tz(`${slotDate}T${slotTimeStr}`, 'Africa/Kigali');
        if (!slotDateTime.isValid()) {
          console.warn('Invalid combined datetime for slot:', slot.slot_id, `${slotDate}T${slotTimeStr}`);
          slotDateTime = null;
        }
      }

      const isSaved = slot.is_saved > 0;
      let friendlyStatus = 'upcoming';

      if (isSaved) {
        friendlyStatus = 'saved';
      } else if (slotDateTime) {
        const oneHourAfter = slotDateTime.add(1, 'hour');
        if (now.isAfter(slotDateTime) && now.isBefore(oneHourAfter)) {
          friendlyStatus = 'current';
        } else if (now.isAfter(oneHourAfter)) {
          friendlyStatus = 'missed';
        } else {
          friendlyStatus = 'upcoming';
        }
      } else {
        console.warn('No valid slotDateTime for slot:', slot.slot_id);
      }

      return {
        ...slot,
        slot_date: slotDate,
        slot_time: slotTimeStr,
        is_saved: isSaved,
        friendly_status: friendlyStatus,
      };
    });

    res.status(200).json(processedSlots);
  } catch (error) {
    console.error('Error fetching member slots:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});


// GET one slot details
router.get('/slotDetails/:slot_id/:member_id', async (req, res) => {
  const { slot_id, member_id } = req.params;

  console.log('🔍 GET slotDetails called with:', { slot_id, member_id });

  try {
    const query = `
      SELECT
        s.slot_id,
        s.slot_date,
        CONVERT(varchar(8), s.slot_time, 108) AS slot_time, -- Format time as HH:mm:ss string
        s.slot_status,
        s.iki_id,
        s.frequency_category,
        s.round_id,
        r.round_status,
        sr.saving_ratio,
        sr.time_limit_minutes,
        (SELECT saved_amount FROM member_saving_activities 
         WHERE slot_id = s.slot_id AND member_id = @member_id) AS saved_amount
      FROM ikimina_saving_slots s
      JOIN ikimina_rounds r ON s.round_id = r.round_id
      LEFT JOIN ikimina_saving_rules sr ON s.iki_id = sr.iki_id
      WHERE s.slot_id = @slot_id
    `;

    const result = await runQuery(query, [
      { name: 'slot_id', type: sql.Int, value: slot_id },
      { name: 'member_id', type: sql.Int, value: member_id }
    ]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    console.log('✅ Slot fetched from DB:', result[0]);
    res.json(result[0]);
  } catch (err) {
    console.error('GET slot details error:', err);
    res.status(500).json({ message: 'Failed to fetch slot details' });
  }
});

// POST saving with penalty logic, phone_used, and notification integration
router.post('/saveSlot', async (req, res) => {
  await poolConnect;
  const { slot_id, member_id, amount, phone_used } = req.body;

  if (!slot_id || !member_id || !amount) {
    return res.status(400).json({
      message: 'Missing required fields: slot_id, member_id, and amount are all required.'
    });
  }

  try {
    const now = dayjs().tz('Africa/Kigali');

    // Get slot info with ikimina details and location (cell, village)
    const slotQuery = `
      SELECT s.slot_id, s.slot_date, s.slot_time, s.iki_id, s.round_id,
             sr.saving_ratio, sr.time_delay_penalty, sr.date_delay_penalty, sr.time_limit_minutes,
             r.round_status,
             i.iki_name,
             l.cell,
             l.village
      FROM ikimina_saving_slots s
      JOIN dbo.ikimina_rounds r ON s.round_id = r.round_id
      LEFT JOIN ikimina_saving_rules sr ON s.iki_id = sr.iki_id AND s.round_id = sr.round_id
      JOIN ikimina_info i ON s.iki_id = i.iki_id
      JOIN ikimina_locations l ON i.location_id = l.location_id
      WHERE s.slot_id = @slot_id
    `;

    const [slot] = await runQuery(slotQuery, [{ name: 'slot_id', type: sql.Int, value: slot_id }]);
    if (!slot) return res.status(404).json({ message: 'Invalid slot. The specified slot was not found.' });
    if (slot.round_status !== 'active') return res.status(400).json({ message: 'You cannot save to this round because it is not active.' });

    if (amount < slot.saving_ratio || amount % slot.saving_ratio !== 0) {
      return res.status(400).json({
        message: `Saving amount must be at least ${slot.saving_ratio} and a multiple of ${slot.saving_ratio}.`
      });
    }

    const existingSave = await runQuery(
      `SELECT 1 FROM member_saving_activities WHERE slot_id = @slot_id AND member_id = @member_id`,
      [
        { name: 'slot_id', type: sql.Int, value: slot_id },
        { name: 'member_id', type: sql.Int, value: member_id }
      ]
    );
    if (existingSave.length > 0) return res.status(400).json({ message: 'You have already saved for this slot.' });

    let phoneToUse = phone_used || await getMemberPhone(member_id);

    // Extract "HH:mm:ss" from slot_time
    let slotTimeStr = null;
    if (slot.slot_time) {
      if (typeof slot.slot_time === 'string') {
        slotTimeStr = slot.slot_time.length >= 8 ? slot.slot_time.substr(0, 8) : null;
      } else if (slot.slot_time instanceof Date) {
        slotTimeStr = slot.slot_time.toISOString().substr(11, 8);
      }
    }

    const scheduled = dayjs.tz(`${dayjs(slot.slot_date).format('YYYY-MM-DD')}T${slotTimeStr}`, 'Africa/Kigali');
    const deadline = scheduled.add(slot.time_limit_minutes || 0, 'minute');

    let penaltyType = null, penaltyAmount = 0, isLate = 0;

    if (now.format('YYYY-MM-DD') !== dayjs(slot.slot_date).format('YYYY-MM-DD')) {
      penaltyType = 'date';
      penaltyAmount = slot.date_delay_penalty || 0;
      isLate = 1;
    } else if (now.isAfter(deadline)) {
      penaltyType = 'time';
      penaltyAmount = slot.time_delay_penalty || 0;
      isLate = 1;
    }

    const insertResult = await pool.request()
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .input('saved_amount', sql.Decimal(10, 2), amount)
      .input('phone_used', sql.VarChar(20), phoneToUse)
      .input('saved_at', sql.DateTime, now.toDate())
      .input('penalty_applied', sql.Decimal(10, 2), penaltyAmount)
      .input('is_late', sql.Bit, isLate)
      .query(`
        INSERT INTO member_saving_activities (
          slot_id, member_id, saved_amount, phone_used, saved_at, penalty_applied, is_late
        )
        OUTPUT inserted.save_id
        VALUES (@slot_id, @member_id, @saved_amount, @phone_used, @saved_at, @penalty_applied, @is_late)
      `);

    const save_id = insertResult.recordset[0].save_id;

    if (isLate === 1) {
      await pool.request()
        .input('save_id', sql.Int, save_id)
        .input('member_id', sql.Int, member_id)
        .input('iki_id', sql.Int, slot.iki_id)
        .input('slot_id', sql.Int, slot.slot_id)
        .input('penalty_type', sql.VarChar(10), penaltyType)
        .input('penalty_amount', sql.Decimal(10, 2), penaltyAmount)
        .input('rule_time_limit_minutes', sql.Int, slot.time_limit_minutes)
        .input('actual_saving_time', sql.Time, now.format('HH:mm:ss'))
        .input('allowed_time_limit', sql.Time, deadline.format('HH:mm:ss'))
        .input('saving_date', sql.Date, now.format('YYYY-MM-DD'))
        .query(`
          INSERT INTO penalty_logs (
            save_id, member_id, iki_id, slot_id,
            penalty_type, penalty_amount, rule_time_limit_minutes,
            actual_saving_time, allowed_time_limit, saving_date
          ) VALUES (
            @save_id, @member_id, @iki_id, @slot_id,
            @penalty_type, @penalty_amount, @rule_time_limit_minutes,
            @actual_saving_time, @allowed_time_limit, @saving_date
          )
        `);
    }

    // Fetch member info (names, email, phone) for notifications
    const memberQuery = `
      SELECT member_names AS member_name, member_email, member_phone_number
      FROM members_info
      WHERE member_id = @member_id
    `;
    const [memberInfo] = await runQuery(memberQuery, [{ name: 'member_id', type: sql.Int, value: member_id }]);

    const locationString = `${slot.cell}, ${slot.village}`;

    // Compose notification messages
    let smsText = `Dear ${memberInfo.member_name}, your saving of ${amount} for Ikimina "${slot.iki_name}" at "${locationString}" on ${dayjs(slot.slot_date).format('YYYY-MM-DD')} (${slotTimeStr}) was recorded successfully. Thank you!`;

    let emailHtml = `
      <p>Dear ${memberInfo.member_name},</p>
      <p>Your saving of <strong>${amount}</strong> for Ikimina <strong>${slot.iki_name}</strong> located at <strong>${locationString}</strong> on <strong>${dayjs(slot.slot_date).format('YYYY-MM-DD')} at ${slotTimeStr}</strong> has been recorded successfully.</p>
      <p>Thank you for saving with us!</p>
    `;

    if (isLate === 1) {
      const penaltyReason = penaltyType === 'date'
        ? 'saving on a different date than scheduled'
        : 'saving after the allowed time';

      smsText = `Dear ${memberInfo.member_name}, your saving of ${amount} for Ikimina "${slot.iki_name}" at "${locationString}" was recorded, but ⚠️ penalty of ${penaltyAmount} applied due to ${penaltyReason}. Scheduled: ${dayjs(slot.slot_date).format('YYYY-MM-DD')} ${slotTimeStr}, Actual: ${now.format('YYYY-MM-DD HH:mm:ss')}, Deadline: ${deadline.format('YYYY-MM-DD HH:mm:ss')}.`;

      emailHtml = `
        <p>Dear ${memberInfo.member_name},</p>
        <p>Your saving of <strong>${amount}</strong> for Ikimina <strong>${slot.iki_name}</strong> located at <strong>${locationString}</strong> has been recorded.</p>
        <p><strong>Penalty applied:</strong> ${penaltyAmount}</p>
        <p>Reason: ${penaltyReason}</p>
        <p>Scheduled Date & Time: ${dayjs(slot.slot_date).format('YYYY-MM-DD')} ${slotTimeStr}</p>
        <p>Actual Saving Date & Time: ${now.format('YYYY-MM-DD HH:mm:ss')}</p>
        <p>Allowed Deadline: ${deadline.format('YYYY-MM-DD HH:mm:ss')}</p>
        <p>Thank you for saving with us!</p>
      `;
    }

    // Send notifications and log results
    let smsSent = 0, emailSent = 0, smsError = null, emailError = null;

    try {
      const [smsResult, emailResult] = await Promise.allSettled([
        sendCustomSms(phoneToUse, smsText),
        sendCustomEmail(memberInfo.member_email, `Saving Confirmation for Ikimina "${slot.iki_name}"`, emailHtml),
      ]);

      smsSent = smsResult.status === 'fulfilled' ? 1 : 0;
      emailSent = emailResult.status === 'fulfilled' ? 1 : 0;

      smsError = smsSent ? null : (smsResult.reason?.message || 'Unknown SMS error');
      emailError = emailSent ? null : (emailResult.reason?.message || 'Unknown Email error');
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
      smsSent = 0;
      emailSent = 0;
      smsError = emailError = notifyErr.message || 'Unknown notification error';
    }

    // Save notification log record
    await pool.request()
      .input('save_id', sql.Int, save_id)
      .input('member_id', sql.Int, member_id)
      .input('iki_id', sql.Int, slot.iki_id)
      .input('slot_id', sql.Int, slot.slot_id)
      .input('sms_sent', sql.Bit, smsSent)
      .input('email_sent', sql.Bit, emailSent)
      .input('sms_error', sql.NVarChar(sql.MAX), smsError)
      .input('email_error', sql.NVarChar(sql.MAX), emailError)
      .query(`
        INSERT INTO notification_logs
        (save_id, member_id, iki_id, slot_id, sms_sent, email_sent, sms_error, email_error, sent_at)
        VALUES
        (@save_id, @member_id, @iki_id, @slot_id, @sms_sent, @email_sent, @sms_error, @email_error, GETDATE())
      `);

    res.json({
      message: 'Saving submitted successfully.',
      save_id,
      penalty_applied: penaltyAmount,
      is_late: !!isLate,
      phone_used: phoneToUse,
      notification: { smsSent: !!smsSent, emailSent: !!emailSent }
    });

  } catch (err) {
    console.error('POST saveSlot error:', err);
    let message = 'An unexpected error occurred while processing your saving.';

    if (err.message.includes('Conversion failed')) {
      message = 'Invalid data format. Please verify the saving amount and phone number.';
    } else if (err.message.includes('Violation of UNIQUE KEY')) {
      message = 'You already submitted a saving for this slot.';
    } else if (err.message.includes('Cannot insert the value NULL')) {
      message = 'Some required fields are missing or incorrect.';
    }

    res.status(500).json({ message });
  }
});

module.exports = router;
