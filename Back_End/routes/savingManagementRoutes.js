const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');
const { sendCustomSms, sendCustomEmail } = require('./notification');
const { requestPayment, getPaymentStatus } = require('./moMoPayment');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const isBetween = require('dayjs/plugin/isBetween');

dayjs.extend(isBetween); 
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

router.get('/memberSlots/:member_id/:iki_id', async (req, res) => {
  const { member_id, iki_id } = req.params;

  try {
    await poolConnect;
    const request = pool.request();

    request.input('member_id', sql.Int, member_id);
    request.input('iki_id', sql.Int, iki_id);

    const query = `
      SELECT 
        s.slot_id, 
        s.iki_id, 
        s.slot_date, 
        s.slot_time, 
        s.frequency_category, 
        s.slot_status, 
        s.round_id,
        r.round_number, 
        r.round_year, 
        r.start_date, 
        r.end_date, 
        r.round_status, 
        r.number_of_categories,

        i.weekly_saving_days,
        i.monthly_saving_days,

        ISNULL(msa.save_id, 0) AS is_saved,
        msa.saved_amount,
        msa.phone_used,
        msa.saved_at,

        pl.penalty_id,
        pl.save_id AS penalty_save_id,
        pl.member_id AS penalty_member_id,
        pl.iki_id AS penalty_iki_id,
        pl.slot_id AS penalty_slot_id,
        pl.penalty_type,
        pl.penalty_amount,
        pl.rule_time_limit_minutes,
        pl.actual_saving_time,
        pl.allowed_time_limit,
        pl.saving_date,
        pl.created_at AS penalty_created_at, 
        pl.is_paid AS penalty_paid,
        pl.paid_at AS penalty_paid_at
      FROM ims_db.dbo.ikimina_saving_slots s
      INNER JOIN ims_db.dbo.ikimina_rounds r ON s.round_id = r.round_id
      INNER JOIN ims_db.dbo.ikimina_info i ON s.iki_id = i.iki_id
      LEFT JOIN ims_db.dbo.member_saving_activities msa 
          ON msa.slot_id = s.slot_id AND msa.member_id = @member_id
      LEFT JOIN ims_db.dbo.penalty_logs pl 
          ON pl.slot_id = s.slot_id AND pl.member_id = @member_id
      WHERE s.iki_id = @iki_id
      ORDER BY s.slot_date ASC, s.slot_time ASC
    `;

    const result = await request.query(query);
    const rawSlots = result.recordset;

    

    const rulesQuery = `
      SELECT TOP 1 saving_ratio, time_limit_minutes 
      FROM ikimina_saving_rules
      WHERE iki_id = @iki_id AND round_id = 
        (SELECT TOP 1 round_id FROM ikimina_saving_slots WHERE iki_id = @iki_id)
    `;
    const rulesResult = await request.query(rulesQuery);
    const rules = rulesResult.recordset[0];

    const now = dayjs().tz('Africa/Kigali');

    const processedSlots = rawSlots.map(slot => {
      const slotDate = slot.slot_date ? dayjs(slot.slot_date).format('YYYY-MM-DD') : null;

      let slotTimeStr = null;
      if (slot.slot_time) {
        if (typeof slot.slot_time === 'string') {
          slotTimeStr = slot.slot_time.length >= 8 ? slot.slot_time.substr(0, 8) : null;
        } else if (slot.slot_time instanceof Date) {
          slotTimeStr = dayjs(slot.slot_time).utc().format('HH:mm:ss');
        }
      }

      let slotDateTime = null;
      if (slotDate && slotTimeStr) {
        slotDateTime = dayjs.tz(`${slotDate}T${slotTimeStr}`, 'Africa/Kigali');
        if (!slotDateTime.isValid()) {
          console.warn('⚠️ Invalid datetime for slot:', slot.slot_id, `${slotDate}T${slotTimeStr}`);
          slotDateTime = null;
        }
      }

      const isSaved = slot.is_saved > 0;
      const savingRatio = rules?.saving_ratio ?? 0;
      const timeLimitMinutes = rules?.time_limit_minutes ?? 0;

      let friendlyStatus = 'upcoming';

      if (isSaved) {
        const savedTime = dayjs(slot.saved_at);
        if (savedTime.isBefore(slotDateTime)) {
          friendlyStatus = 'saved';
        } else if (savedTime.isAfter(slotDateTime)) {
          friendlyStatus = 'saved but late';
        }
      } else if (slotDateTime) {
        const timeLimit = slotDateTime.add(timeLimitMinutes, 'minute');
        if (now.isBetween(slotDateTime, timeLimit)) {
          friendlyStatus = 'pending';
        } else if (now.isAfter(timeLimit)) {
          friendlyStatus = 'missed';
        } else {
          friendlyStatus = 'upcoming';
        }
      }

      if (!isSaved && slotDateTime && slotDateTime.isAfter(now)) {
        friendlyStatus = 'upcoming but saved';
      }

      return {
        ...slot,
        slot_date: slotDate,
        slot_time: slotTimeStr,
        is_saved: isSaved,
        friendly_status: friendlyStatus,
        saved_amount: slot.saved_amount ?? null,
        phone_used: slot.phone_used ?? null,
        saved_at: slot.saved_at ?? null,
        penalty_amount: slot.penalty_amount ?? null,
        penalty_paid: slot.penalty_paid ?? false,
        penalty_paid_at: slot.penalty_paid_at ?? null,
        penalty_type: slot.penalty_type ?? null,
        rule_time_limit_minutes: slot.rule_time_limit_minutes ?? null,
        actual_saving_time: slot.actual_saving_time ?? null,
        allowed_time_limit: slot.allowed_time_limit ?? null,
        saving_date: slot.saving_date ?? null,
        penalty_created_at: slot.penalty_created_at ?? null,
        weekly_saving_day: slot.weekly_saving_days ?? 'Monday',
        monthly_start_day: slot.monthly_saving_days ?? 1
      };
    });


    res.status(200).json(processedSlots);
  } catch (error) {
    console.error('❌ Error fetching member slots:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// Fetch details for a specific slot
router.get('/slotDetails/:slot_id/:member_id', async (req, res) => {
  const { slot_id, member_id } = req.params;

  try {
    const query = `
      SELECT
        s.slot_id,
        s.slot_date,
        CONVERT(varchar(8), s.slot_time, 108) AS slot_time,
        s.slot_status,
        s.iki_id,
        s.frequency_category,
        s.round_id,
        r.round_status,
        sr.saving_ratio,
        sr.time_limit_minutes,

        -- saved info
        (SELECT saved_amount FROM member_saving_activities 
         WHERE slot_id = s.slot_id AND member_id = @member_id) AS saved_amount,
        (SELECT phone_used FROM member_saving_activities
         WHERE slot_id = s.slot_id AND member_id = @member_id) AS phone_used,

        -- penalty info
        pl.penalty_amount,
        pl.is_paid,
        pl.paid_at

      FROM ikimina_saving_slots s
      JOIN ikimina_rounds r ON s.round_id = r.round_id
      LEFT JOIN ikimina_saving_rules sr ON s.iki_id = sr.iki_id
      LEFT JOIN penalty_logs pl ON pl.slot_id = s.slot_id AND pl.member_id = @member_id
      WHERE s.slot_id = @slot_id
    `;

    const result = await runQuery(query, [
      { name: 'slot_id', type: sql.Int, value: slot_id },
      { name: 'member_id', type: sql.Int, value: member_id }
    ]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    res.json(result[0]);
  } catch (err) {
    console.error('GET slot details error:', err);
    res.status(500).json({ message: 'Failed to fetch slot details' });
  }
});



async function getMemberPhone(member_id) {
  const query = `
    SELECT member_phone_number
    FROM ims_db.dbo.members_info
    WHERE member_id = @member_id
  `;
  const result = await runQuery(query, [{ name: 'member_id', type: sql.Int, value: member_id }]);
  return result.length > 0 ? result[0].member_phone_number : null;
}


router.post('/newSaving', async (req, res) => {
  await poolConnect;
  const { slot_id, member_id, amount, phone_used } = req.body;

  if (!slot_id || !member_id || !amount) {
    return res.status(400).json({
      message: 'Missing required fields: slot_id, member_id, and amount are all required.'
    });
  }

  try {
    // Current time in UTC for storing consistently
    const nowUtc = dayjs().utc();

    // For user-facing displays, convert UTC to Kigali timezone
    const nowKigali = nowUtc.tz('Africa/Kigali');

    // Fetch slot and related info including saving rules
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

    // Check if member already saved for this slot
    const existingSave = await runQuery(
      `SELECT 1 FROM member_saving_activities WHERE slot_id = @slot_id AND member_id = @member_id`,
      [
        { name: 'slot_id', type: sql.Int, value: slot_id },
        { name: 'member_id', type: sql.Int, value: member_id }
      ]
    );
    if (existingSave.length > 0) return res.status(400).json({ message: 'You have already saved for this slot.' });

    // Get phone number if not provided
    let phoneToUse = phone_used || await getMemberPhone(member_id);

    // Prepare slot time string HH:mm:ss
    let slotTimeStr = null;
    if (slot.slot_time) {
      if (typeof slot.slot_time === 'string') {
        slotTimeStr = slot.slot_time.length >= 8 ? slot.slot_time.substr(0, 8) : null;
      } else if (slot.slot_time instanceof Date) {
        slotTimeStr = slot.slot_time.toISOString().substr(11, 8);
      }
    }

    // Scheduled datetime (slot_date + slot_time) in Kigali timezone, then convert to UTC for comparison/storage
    const scheduledKigali = dayjs.tz(`${dayjs(slot.slot_date).format('YYYY-MM-DD')}T${slotTimeStr}`, 'Africa/Kigali');
    const scheduledUtc = scheduledKigali.utc();

    // Deadline is scheduled time + time limit (in minutes), in UTC
    const deadlineUtc = scheduledUtc.add(slot.time_limit_minutes || 0, 'minute');

    // Prepare date-only for penalty logic
    const slotDate = scheduledKigali.startOf('day');
    const nowDate = nowKigali.startOf('day');

    let penaltyType = null, penaltyAmount = 0, isLate = 0;

    if (nowDate.isBefore(slotDate)) {
      // Saved early, no penalty
      isLate = 0;
    } else if (nowDate.isSame(slotDate)) {
      // Same day → check time deadline
      if (nowUtc.isAfter(deadlineUtc)) {
        penaltyType = 'time';
        penaltyAmount = slot.time_delay_penalty || 0;
        isLate = 1;
      }
    } else {
      // Saved on a future day after scheduled date → date penalty
      penaltyType = 'date';
      penaltyAmount = slot.date_delay_penalty || 0;
      isLate = 1;
    }

    // Insert saving record (store UTC time)
    const insertResult = await pool.request()
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .input('saved_amount', sql.Decimal(10, 2), amount)
      .input('phone_used', sql.VarChar(20), phoneToUse)
      .input('saved_at', sql.DateTime, nowUtc.toDate()) // store in UTC
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

    // Log penalty details if late
    if (isLate === 1) {
      // Actual saving time and allowed deadline as SQL Time types (store only time part, in UTC)
      const actualSavingTime = new Date(Date.UTC(1970, 0, 1, nowUtc.hour(), nowUtc.minute(), nowUtc.second()));
      const allowedTimeLimit = new Date(Date.UTC(1970, 0, 1, deadlineUtc.hour(), deadlineUtc.minute(), deadlineUtc.second()));

      await pool.request()
        .input('save_id', sql.Int, save_id)
        .input('member_id', sql.Int, member_id)
        .input('iki_id', sql.Int, slot.iki_id)
        .input('slot_id', sql.Int, slot.slot_id)
        .input('penalty_type', sql.VarChar(10), penaltyType)
        .input('penalty_amount', sql.Decimal(10, 2), penaltyAmount)
        .input('rule_time_limit_minutes', sql.Int, slot.time_limit_minutes)
        .input('actual_saving_time', sql.Time, actualSavingTime)
        .input('allowed_time_limit', sql.Time, allowedTimeLimit)
        .input('saving_date', sql.Date, nowUtc.format('YYYY-MM-DD'))
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

    // Fetch member info for notifications
    const memberQuery = `
      SELECT member_names AS member_name, member_email, member_phone_number
      FROM members_info
      WHERE member_id = @member_id
    `;
    const [memberInfo] = await runQuery(memberQuery, [{ name: 'member_id', type: sql.Int, value: member_id }]);

    const locationString = `${slot.cell}, ${slot.village}`;

    // Format times in Kigali timezone for user display
    const scheduledDisplay = scheduledKigali.format('YYYY-MM-DD HH:mm:ss');
    const actualSavingDisplay = nowKigali.format('YYYY-MM-DD HH:mm:ss');
    const deadlineDisplay = deadlineUtc.tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss');

    let smsText = `Dear ${memberInfo.member_name}, your saving of ${amount} RWF on "${slot.iki_name}" at "${locationString}" on ${scheduledDisplay} was recorded successfully. Thank you!`;

    let emailHtml = `
      <p>Dear ${memberInfo.member_name},</p>
      <p>Your saving of <strong>${amount}</strong> on <strong>${slot.iki_name}</strong> located at <strong>${locationString}</strong> on <strong>${scheduledDisplay}</strong> has been recorded successfully.</p>
      <p>Thank you for saving with us!</p>
    `;

    if (isLate === 1) {
      const penaltyReason = penaltyType === 'date'
        ? 'You saved after your group’s scheduled date'
        : 'You saved after the allowed time';

      smsText = `Dear ${memberInfo.member_name}, your saving of ${amount} for Ikimina "${slot.iki_name}" at "${locationString}" was recorded, but ⚠️ penalty of ${penaltyAmount} applied due to ${penaltyReason}. Scheduled: ${scheduledDisplay}, Actual: ${actualSavingDisplay}, Deadline: ${deadlineDisplay}.`;

      emailHtml = `
        <p>Dear ${memberInfo.member_name},</p>
        <p>Your saving of <strong>${amount}</strong> for Ikimina <strong>${slot.iki_name}</strong> located at <strong>${locationString}</strong> has been recorded.</p>
        <p><strong>Penalty applied:</strong> ${penaltyAmount}</p>
        <p>Reason: ${penaltyReason}</p>
        <p>Scheduled Date & Time: ${scheduledDisplay}</p>
        <p>Actual Saving Date & Time: ${actualSavingDisplay}</p>
        <p>Allowed Deadline: ${deadlineDisplay}</p>
        <p>Thank you for saving with us!</p>
      `;
    }

    // Send notifications
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

    // Log notification results
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

// === Pay Penalty Route ===
router.post('/payPenalty', async (req, res) => {
  await poolConnect;
  const { slot_id, member_id } = req.body;

  if (!slot_id || !member_id) {
    return res.status(400).json({ message: 'Missing required fields: slot_id and member_id.' });
  }

  try {
    const checkQuery = `
      SELECT * FROM penalty_logs 
      WHERE slot_id = @slot_id AND member_id = @member_id AND is_paid = 0
    `;
    const checkResult = await pool
      .request()
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Unpaid penalty not found for this member and slot.' });
    }

    const updateQuery = `
      UPDATE penalty_logs 
      SET is_paid = 1, paid_at = GETDATE() 
      WHERE slot_id = @slot_id AND member_id = @member_id
    `;
    await pool
      .request()
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .query(updateQuery);

    // Fetch member contact details
    const memberQuery = `
      SELECT member_phone_number, member_email, member_names 
      FROM Members_info 
      WHERE member_id = @member_id
    `;
    const memberInfo = await pool
      .request()
      .input('member_id', sql.Int, member_id)
      .query(memberQuery);

    if (memberInfo.recordset.length === 0) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    const { member_phone_number, member_email, member_names } = memberInfo.recordset[0];

    // Construct message
    const message = `Hello ${member_names}, your penalty for slot ${slot_id} has been marked as paid. Thank you.`;

    // Send SMS & Email (parallel)
    const [smsResult, emailResult] = await Promise.allSettled([
      sendCustomSms(member_phone_number, message),
      sendCustomEmail(member_email, 'Penalty Paid', message),
    ]);

    const smsSent = smsResult.status === 'fulfilled';
    const smsError = smsSent ? null : smsResult.reason.message;

    const emailSent = emailResult.status === 'fulfilled';
    const emailError = emailSent ? null : emailResult.reason.message;


    res.status(200).json({
      message: `Penalty for ${member_names} has been paid successfully and notifications sent.`,
      smsSent,
      emailSent,
      smsError,
      emailError,
    });

  } catch (error) {
    console.error('❌ Error processing penalty payment:', error);
    res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
});



//===  newSaving Route with Real Payment Integration ===
// router.post('/newSaving', async (req, res) => {
//   await poolConnect;
//   const transaction = new sql.Transaction(pool);
//   const { slot_id, member_id, amount, phone } = req.body;

//   // Validate required fields
//   if (!slot_id || !member_id || !amount) {
//     return res.status(400).json({ message: 'slot_id, member_id, and amount are required.' });
//   }

//   // Validate and normalize phone
//   if (phone && !/^\d{10,15}$/.test(phone)) {
//     return res.status(400).json({ message: 'Phone number must be between 10 and 15 digits, digits only.' });
//   }
//   const phoneToUse = phone?.startsWith('25') ? phone : phone ? `25${phone}` : null;

//   try {
//     await transaction.begin();

//     // Fetch slot info
//   const slotResult = await transaction.request()
//   .input('slot_id', sql.Int, slot_id)
//   .query(`
//     SELECT s.slot_id, s.slot_date, s.slot_time, s.iki_id, s.round_id,
//            sr.saving_ratio, sr.time_delay_penalty, sr.date_delay_penalty, sr.time_limit_minutes,
//            r.round_status,
//            i.iki_name,
//            l.cell,
//            l.village
//     FROM ikimina_saving_slots s
//     JOIN dbo.ikimina_rounds r ON s.round_id = r.round_id
//     LEFT JOIN ikimina_saving_rules sr ON s.iki_id = sr.iki_id AND s.round_id = sr.round_id
//     JOIN ikimina_info i ON s.iki_id = i.iki_id
//     JOIN ikimina_locations l ON i.location_id = l.location_id
//     WHERE s.slot_id = @slot_id
//   `);


//    if (!slotResult?.recordset || slotResult.recordset.length === 0) {
    
//       await transaction.rollback();
//       return res.status(404).json({ message: 'Slot not found.' });
//     }

//     const slot = slotResult.recordset[0];
//     const savedAt = dayjs().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss');

//     // Check for duplicate save
//     const duplicateCheck = await pool.request()
//       .input('slot_id', sql.Int, slot_id)
//       .input('member_id', sql.Int, member_id)
//       .query(`
//         SELECT * FROM member_saving_activities
//         WHERE slot_id = @slot_id AND member_id = @member_id
//       `);

//     if (duplicateCheck.recordset.length > 0) {
//       await transaction.rollback();
//       return res.status(409).json({ message: 'You already saved for this slot.' });
//     }

//     await transaction.commit(); // End early transaction before MoMo call

//     // ======= 💰 MoMo Payment Integration =======
//     let momoRefId;
//     try {
//       momoRefId = await requestPayment({
//         amount,
//         phone: phoneToUse,
//         externalId: `${slot_id}_${member_id}`,
//         payerMessage: 'Ikimina saving payment',
//         payeeNote: 'Thanks for saving'
//       });
//     } catch (paymentError) {
//       return res.status(500).json({
//         message: 'Failed to initiate MoMo payment.',
//         error: paymentError.message
//       });
//     }

//     // Poll for payment confirmation
//     let status = 'PENDING';
//     let attempts = 0;
//     while (status === 'PENDING' && attempts < 10) {
//       await new Promise(res => setTimeout(res, 3000)); // wait 3s
//       try {
//         const result = await getPaymentStatus(momoRefId);
//         status = result.status;
//       } catch (e) {
//         return res.status(500).json({ message: 'Error checking payment status.', error: e.message });
//       }
//       attempts++;
//     }

//     if (status !== 'SUCCESSFUL') {
//       return res.status(400).json({ message: `Payment failed or timed out. Status: ${status}` });
//     }

//     // ======= 🧾 DB Insert Transaction After Payment =======
//     const transaction2 = new sql.Transaction(pool);
//     await transaction2.begin();

//     try {
//       const now = dayjs().tz('Africa/Kigali');
//       const slotDate = dayjs(slot.slot_date).tz('Africa/Kigali');
//       const isLate = now.isAfter(slotDate, 'day');
//       const penalty = isLate ? 200 : 0;

//       const insertSaving = await transaction2.request()
//         .input('slot_id', sql.Int, slot_id)
//         .input('member_id', sql.Int, member_id)
//         .input('saved_amount', sql.Decimal(10, 2), amount)
//         .input('phone_used', sql.VarChar(15), phoneToUse)
//         .input('saved_at', sql.DateTime, savedAt)
//         .input('penalty_applied', sql.Decimal(10, 2), penalty)
//         .input('is_late', sql.Bit, isLate)
//         .input('momo_reference_id', sql.UniqueIdentifier, momoRefId)
//         .query(`
//           INSERT INTO member_saving_activities (
//             slot_id, member_id, saved_amount, phone_used, saved_at, penalty_applied, is_late, momo_reference_id
//           )
//           OUTPUT inserted.save_id
//           VALUES (@slot_id, @member_id, @saved_amount, @phone_used, @saved_at, @penalty_applied, @is_late, @momo_reference_id)
//         `);

//       const save_id = insertSaving.recordset[0].save_id;

//       // Log penalty if late
//       if (isLate) {
//         await transaction2.request()
//           .input('member_id', sql.Int, member_id)
//           .input('slot_id', sql.Int, slot_id)
//           .input('penalty_amount', sql.Decimal(10, 2), penalty)
//           .input('applied_at', sql.DateTime, savedAt)
//           .query(`
//             INSERT INTO member_penalty_log (
//               member_id, slot_id, penalty_amount, applied_at
//             )
//             VALUES (@member_id, @slot_id, @penalty_amount, @applied_at)
//           `);
//       }

//       await transaction2.commit();

//       // Notifications
//       const sms = `Thanks! Your ${amount} RWF saving for ${slot.iki_name} has been received on ${savedAt.split(' ')[0]}.`;
//       sendCustomSms(phoneToUse, sms);
//       sendCustomEmail(slot.iki_email, 'Saving Confirmed', sms);

//       return res.status(201).json({
//         message: 'Saving completed successfully.',
//         save_id,
//         penalty_applied: penalty,
//         is_late: isLate
//       });

//     } catch (err) {
//       await transaction2.rollback();
//       console.error('❌ Error after MoMo payment:', err);
//       return res.status(500).json({ message: 'Failed to save after payment.', error: err.message });
//     }

//   } catch (err) {
//     try {
//       await transaction.rollback();
//     } catch (_) {
//       // transaction might already be committed or rolled back
//     }
//     console.error('❌ Unexpected error:', err);
//     return res.status(500).json({ message: 'Unexpected error occurred.', error: err.message });
//   }
// });

// === Pay Penalty Route with Real Payment Integration ===
router.post('/payPenalty', async (req, res) => {
  await poolConnect;
  const transaction = new sql.Transaction(pool);
  const { slot_id, member_id, phone } = req.body;

  if (!slot_id || !member_id) {
    return res.status(400).json({ message: 'Missing required fields: slot_id and member_id.' });
  }

  // Validate phone if provided
  if (phone && !/^\d{10,15}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be 10 to 15 digits.' });
  }
  const phoneToUse = phone?.startsWith('25') ? phone : phone ? `25${phone}` : null;

  try {
    // Check unpaid penalty exists
    const checkResult = await pool.request()
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .query(`
        SELECT * FROM penalty_logs 
        WHERE slot_id = @slot_id AND member_id = @member_id AND is_paid = 0
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'No unpaid penalty found for this member and slot.' });
    }

    const penaltyRecord = checkResult.recordset[0];
    const penaltyAmount = penaltyRecord.penalty_amount;

    // Fetch member contact details
    const memberInfoResult = await pool.request()
      .input('member_id', sql.Int, member_id)
      .query(`
        SELECT member_phone_number, member_email, member_names 
        FROM Members_info 
        WHERE member_id = @member_id
      `);

    if (memberInfoResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    const { member_phone_number, member_email, member_names } = memberInfoResult.recordset[0];

    // Determine phone to charge: priority - provided phone in body, else member phone from DB
    const finalPhone = phoneToUse || (member_phone_number?.startsWith('25') ? member_phone_number : `25${member_phone_number}`);

    // Initiate MoMo payment
    let momoRefId;
    try {
      momoRefId = await requestPayment({
        amount: penaltyAmount,
        phone: finalPhone,
        externalId: `penalty_${slot_id}_${member_id}`,
        payerMessage: 'Ikimina penalty payment',
        payeeNote: 'Penalty payment for Ikimina saving slot',
      });
    } catch (paymentError) {
      return res.status(500).json({
        message: 'Failed to initiate MoMo payment.',
        error: paymentError.message,
      });
    }

    // Poll payment status (max 10 tries, 3s interval)
    let status = 'PENDING';
    let attempts = 0;
    while (status === 'PENDING' && attempts < 10) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const result = await getPaymentStatus(momoRefId);
        status = result.status;
      } catch (e) {
        return res.status(500).json({ message: 'Error checking payment status.', error: e.message });
      }
      attempts++;
    }

    if (status !== 'SUCCESSFUL') {
      return res.status(400).json({ message: `Payment was not successful. Status: ${status}` });
    }

    // Payment succeeded - update penalty_logs in transaction
    await transaction.begin();

    const paidAt = dayjs().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss');

    await transaction.request()
      .input('paid_at', sql.DateTime, paidAt)
      .input('momo_ref_id', sql.UniqueIdentifier, momoRefId)
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .query(`
        UPDATE penalty_logs 
        SET is_paid = 1, paid_at = @paid_at, momo_reference_id = @momo_ref_id 
        WHERE slot_id = @slot_id AND member_id = @member_id AND is_paid = 0
      `);

    await transaction.commit();

    // Send notifications in parallel
    const message = `Hello ${member_names}, your penalty for slot ${slot_id} has been paid successfully. Thank you!`;
    const [smsResult, emailResult] = await Promise.allSettled([
      sendCustomSms(finalPhone, message),
      sendCustomEmail(member_email, 'Penalty Paid', message),
    ]);

    return res.status(200).json({
      message: `Penalty for ${member_names} has been paid successfully with MoMo and notifications sent.`,
      smsSent: smsResult.status === 'fulfilled',
      emailSent: emailResult.status === 'fulfilled',
      smsError: smsResult.status === 'rejected' ? smsResult.reason?.message : null,
      emailError: emailResult.status === 'rejected' ? emailResult.reason?.message : null,
    });

  } catch (error) {
    if (transaction._aborted !== true) {
      try {
        await transaction.rollback();
      } catch {}
    }
    console.error('❌ Error processing penalty payment:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
});

router.post('/logNotification', async (req, res) => {
  const { slot_id, member_id } = req.body;

  if (!slot_id || !member_id) {
    return res.status(400).json({ message: 'slot_id and member_id required.' });
  }

  try {
    // Fetch the most recent paid penalty with all needed fields
    const penaltyData = await runQuery(
      `SELECT TOP 1 penalty_id, iki_id, slot_id 
       FROM penalty_logs 
       WHERE slot_id = @slot_id 
         AND member_id = @member_id 
         AND is_paid = 1 
       ORDER BY paid_at DESC`,
      [
        { name: 'slot_id', type: sql.Int, value: slot_id },
        { name: 'member_id', type: sql.Int, value: member_id },
      ]
    );

    if (!penaltyData.length) {
      return res.status(404).json({ message: 'No paid penalty found to log.' });
    }

    const penalty = penaltyData[0];

    // Insert into notification_logs with all required NOT NULL fields
    await pool.request()
      .input('save_id', sql.Int, penalty.penalty_id)   // penalty_id used as save_id here
      .input('member_id', sql.Int, member_id)
      .input('iki_id', sql.Int, penalty.iki_id)
      .input('slot_id', sql.Int, penalty.slot_id)
      .input('sms_sent', sql.Bit, 1)
      .input('email_sent', sql.Bit, 1)
      .input('sms_error', sql.NVarChar(sql.MAX), null)
      .input('email_error', sql.NVarChar(sql.MAX), null)
      .query(`
        INSERT INTO notification_logs
          (save_id, member_id, iki_id, slot_id, sms_sent, email_sent, sms_error, email_error, sent_at)
        VALUES
          (@save_id, @member_id, @iki_id, @slot_id, @sms_sent, @email_sent, @sms_error, @email_error, GETDATE())
      `);

    return res.status(200).json({ message: 'Notification logged.' });

  } catch (err) {
    console.error('logNotification error:', err);
    return res.status(500).json({ message: 'Failed to log notification.', error: err.message });
  }
});

// router.get('/memberSavingSummary/:memberId/:ikiId', async (req, res) => {
//   const { memberId, ikiId } = req.params;

//   console.log('Received request for memberId:', memberId, 'ikiId:', ikiId);

//   if (!memberId || !ikiId) {
//     return res.status(400).json({ error: 'memberId and ikiId are required' });
//   }

//   try {
//     await poolConnect;

//     const request = pool.request();
//     request.input('memberId', sql.Int, memberId);
//     request.input('ikiId', sql.Int, ikiId);
//     request.input('now', sql.DateTime, new Date());

//     const query = `
//     WITH MemberSlots AS (
//       SELECT
//         s.slot_id,
//         s.slot_date,
//         s.slot_time,
//         s.frequency_category,
//         s.slot_status,
//         s.round_id
//       FROM ikimina_saving_slots s
//       WHERE s.iki_id = @ikiId
//     ),
//     MemberSavings AS (
//       SELECT
//         sa.save_id,
//         sa.slot_id,
//         sa.saved_amount,
//         sa.saved_at,
//         sa.penalty_applied,
//         sa.is_late,
//         sa.phone_used,
//         sa.momo_reference_id
//       FROM member_saving_activities sa
//       WHERE sa.member_id = @memberId
//     ),
//     MemberPenalties AS (
//       SELECT
//         p.penalty_id,
//         p.slot_id,
//         p.penalty_type,
//         p.penalty_amount,
//         p.is_paid,
//         p.paid_at
//       FROM penalty_logs p
//       WHERE p.member_id = @memberId AND p.iki_id = @ikiId
//     ),
//     SlotsWithSavingsAndPenalties AS (
//       SELECT
//         ms.slot_id,
//         ms.slot_date,
//         ms.slot_time,
//         ms.frequency_category,
//         ms.slot_status,
//         ms.round_id,
//         COALESCE(sa.saved_amount, 0) AS saved_amount,
//         sa.saved_at,
//         CASE WHEN sa.save_id IS NOT NULL THEN 1 ELSE 0 END AS is_saved,
//         p.penalty_amount,
//         p.is_paid AS penalty_paid
//       FROM MemberSlots ms
//       LEFT JOIN MemberSavings sa ON ms.slot_id = sa.slot_id
//       LEFT JOIN MemberPenalties p ON ms.slot_id = p.slot_id
//     )
//     SELECT
//       s.slot_id,
//       s.slot_date,
//       s.slot_time,
//       s.frequency_category,
//       s.slot_status,
//       s.round_id,
//       s.saved_amount,
//       s.saved_at,
//       s.is_saved,
//       s.penalty_amount,
//       s.penalty_paid,

//       (SELECT SUM(saved_amount) FROM SlotsWithSavingsAndPenalties) AS total_saved_amount,
//       (SELECT COUNT(*) FROM SlotsWithSavingsAndPenalties WHERE is_saved = 1) AS slots_completed,
//       (SELECT COUNT(*) FROM SlotsWithSavingsAndPenalties) AS total_slots,
//       (SELECT ISNULL(SUM(penalty_amount),0) FROM SlotsWithSavingsAndPenalties WHERE penalty_paid = 1) AS total_penalties_paid,
//       (SELECT ISNULL(SUM(penalty_amount),0) FROM SlotsWithSavingsAndPenalties WHERE (penalty_paid = 0 OR penalty_paid IS NULL) AND penalty_amount > 0) AS total_penalties_unpaid,
//       (SELECT AVG(NULLIF(saved_amount, 0)) FROM SlotsWithSavingsAndPenalties WHERE is_saved = 1) AS average_saving_amount,
//       (SELECT MAX(saved_at) FROM SlotsWithSavingsAndPenalties WHERE saved_at IS NOT NULL) AS most_recent_saving_at,
//       (SELECT TOP 1 slot_date FROM SlotsWithSavingsAndPenalties WHERE slot_date > CONVERT(date, @now) ORDER BY slot_date ASC) AS next_upcoming_slot_date
//     FROM SlotsWithSavingsAndPenalties s
//     ORDER BY s.slot_date ASC;
//     `;

//     const result = await request.query(query);

//     if (result.recordset.length === 0) {
//       return res.status(404).json({ error: 'No saving slots found for this member and iki' });
//     }

//     const aggregates = {
//       total_saved_amount: result.recordset[0].total_saved_amount,
//       slots_completed: result.recordset[0].slots_completed,
//       total_slots: result.recordset[0].total_slots,
//       total_penalties_paid: result.recordset[0].total_penalties_paid,
//       total_penalties_unpaid: result.recordset[0].total_penalties_unpaid,
//       average_saving_amount: result.recordset[0].average_saving_amount,
//       most_recent_saving_at: result.recordset[0].most_recent_saving_at,
//       next_upcoming_slot_date: result.recordset[0].next_upcoming_slot_date,
//     };

//     const slots = result.recordset.map(({ 
//       total_saved_amount, slots_completed, total_slots, 
//       total_penalties_paid, total_penalties_unpaid, 
//       average_saving_amount, most_recent_saving_at, 
//       next_upcoming_slot_date, ...slot 
//     }) => slot);

//     console.log('Sending member saving summary data:', { slots, aggregates });

//     res.json({ slots, aggregates });
//   } catch (error) {
//     console.error('Error fetching member saving summary:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });



router.get('/memberRounds/:memberId/:ikiId', async (req, res) => {
  const { memberId, ikiId } = req.params;

  if (!memberId || !ikiId) {
    console.warn('Missing memberId or ikiId');
    return res.status(400).json({ error: 'memberId and ikiId are required' });
  }

  try {
    await poolConnect;

    const request = pool.request();
    request.input('ikiId', sql.Int, ikiId);

    const roundsQuery = `
      SELECT round_id, round_number, round_year
      FROM ikimina_rounds
      WHERE iki_id = @ikiId
      ORDER BY round_year ASC, round_number ASC
    `;

    const result = await request.query(roundsQuery);


    res.json({ rounds: result.recordset });
  } catch (error) {
    console.error('Error fetching rounds:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/memberSavingSummary/:memberId/:ikiId', async (req, res) => {
  const { memberId, ikiId } = req.params;
  let { roundIds } = req.query;

  if (!memberId || !ikiId) {
    console.warn('Missing memberId or ikiId');
    return res.status(400).json({ error: 'memberId and ikiId are required' });
  }

  try {
    await poolConnect;

    const request = pool.request();
    request.input('memberId', sql.Int, memberId);
    request.input('ikiId', sql.Int, ikiId);
    request.input('now', sql.DateTime, new Date());

    let roundFilterClause = '';
    if (roundIds) {
      const roundsArray = roundIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (roundsArray.length > 0) {
        const roundParams = roundsArray.map((id, idx) => `@roundId${idx}`).join(',');
        roundsArray.forEach((id, idx) => request.input(`roundId${idx}`, sql.Int, id));
        roundFilterClause = `AND ms.round_id IN (${roundParams})`;
      }
    }

    const query = `
    WITH MemberSlots AS (
      SELECT
        s.slot_id,
        s.slot_date,
        s.slot_time,
        s.frequency_category,
        s.slot_status,
        s.round_id
      FROM ikimina_saving_slots s
      WHERE s.iki_id = @ikiId
      ${roundFilterClause}
    ),
    MemberSavings AS (
      SELECT
        sa.save_id,
        sa.slot_id,
        sa.saved_amount,
        sa.saved_at,
        sa.penalty_applied,
        sa.is_late,
        sa.phone_used,
        sa.momo_reference_id
      FROM member_saving_activities sa
      WHERE sa.member_id = @memberId
    ),
    MemberPenalties AS (
      SELECT
        p.penalty_id,
        p.slot_id,
        p.penalty_type,
        p.penalty_amount,
        p.is_paid,
        p.paid_at
      FROM penalty_logs p
      WHERE p.member_id = @memberId AND p.iki_id = @ikiId
    ),
    SlotsWithSavingsAndPenalties AS (
      SELECT
        ms.slot_id,
        ms.slot_date,
        ms.slot_time,
        ms.frequency_category,
        ms.slot_status,
        ms.round_id,
        COALESCE(sa.saved_amount, 0) AS saved_amount,
        sa.saved_at,
        CASE WHEN sa.save_id IS NOT NULL THEN 1 ELSE 0 END AS is_saved,
        p.penalty_amount,
        p.is_paid AS penalty_paid
      FROM MemberSlots ms
      LEFT JOIN MemberSavings sa ON ms.slot_id = sa.slot_id
      LEFT JOIN MemberPenalties p ON ms.slot_id = p.slot_id
    )
    SELECT
      s.slot_id,
      s.slot_date,
      s.slot_time,
      s.frequency_category,
      s.slot_status,
      s.round_id,
      s.saved_amount,
      s.saved_at,
      s.is_saved,
      s.penalty_amount,
      s.penalty_paid,

      (SELECT ISNULL(SUM(saved_amount),0) FROM SlotsWithSavingsAndPenalties) AS total_saved_amount,
      (SELECT COUNT(*) FROM SlotsWithSavingsAndPenalties WHERE is_saved = 1) AS slots_completed,
      (SELECT COUNT(*) FROM SlotsWithSavingsAndPenalties) AS total_slots,
      (SELECT ISNULL(SUM(penalty_amount),0) FROM SlotsWithSavingsAndPenalties WHERE penalty_paid = 1) AS total_penalties_paid,
      (SELECT ISNULL(SUM(penalty_amount),0) FROM SlotsWithSavingsAndPenalties WHERE (penalty_paid = 0 OR penalty_paid IS NULL) AND penalty_amount > 0) AS total_penalties_unpaid,
      (SELECT AVG(NULLIF(saved_amount, 0)) FROM SlotsWithSavingsAndPenalties WHERE is_saved = 1) AS average_saving_amount,
      (SELECT MAX(saved_at) FROM SlotsWithSavingsAndPenalties WHERE saved_at IS NOT NULL) AS most_recent_saving_at,
      (SELECT TOP 1 slot_date FROM SlotsWithSavingsAndPenalties WHERE slot_date > CONVERT(date, @now) ORDER BY slot_date ASC) AS next_upcoming_slot_date
    FROM SlotsWithSavingsAndPenalties s
    ORDER BY s.slot_date ASC;
    `;

    const result = await request.query(query);

   

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No saving slots found for this member, iki, and selected rounds' });
    }

    const aggregates = {
      total_saved_amount: result.recordset[0].total_saved_amount,
      slots_completed: result.recordset[0].slots_completed,
      total_slots: result.recordset[0].total_slots,
      total_penalties_paid: result.recordset[0].total_penalties_paid,
      total_penalties_unpaid: result.recordset[0].total_penalties_unpaid,
      average_saving_amount: result.recordset[0].average_saving_amount,
      most_recent_saving_at: result.recordset[0].most_recent_saving_at,
      next_upcoming_slot_date: result.recordset[0].next_upcoming_slot_date,
    };

    const slots = result.recordset.map(({ 
      total_saved_amount, slots_completed, total_slots, 
      total_penalties_paid, total_penalties_unpaid, 
      average_saving_amount, most_recent_saving_at, 
      next_upcoming_slot_date, ...slot 
    }) => slot);

    res.json({ slots, aggregates });
  } catch (error) {
    console.error('Error fetching member saving summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;