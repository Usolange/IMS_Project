const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');
const { sendCustomSms, sendCustomEmail } = require('./notification');
const { cashin, getTransactionStatus, getTransactionEvents } = require('./moMoPayment');
const { logPayment } = require('./paymentLogger');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isBetween = require('dayjs/plugin/isBetween');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

async function runQuery(query, params = []) {
  await poolConnect;
  const request = pool.request();
  params.forEach(({ name, type, value }) => request.input(name, type, value));
  const result = await request.query(query);
  return result.recordset;
}


// Fetch member phone number by member_id helper
async function getMemberPhone(member_id) {
  await poolConnect;
  const request = pool.request();
  const result = await request
    .input('member_id', sql.Int, member_id)
    .query('SELECT member_phone_number FROM ims_db.dbo.members_info WHERE member_id = @member_id');
  return result.recordset.length ? result.recordset[0].member_phone_number : null;
}

async function updatePaymentStatusInDb(reference, newStatus) {
  await poolConnect;
  const request = pool.request();
  const result = await request
    .input('reference', sql.VarChar(100), reference)
    .input('status', sql.VarChar(50), newStatus)
    .query(`
      UPDATE member_saving_activities
      SET payment_status = @status
      WHERE momo_reference_id = @reference
    `);

  if (result.rowsAffected[0] === 0) {
    console.warn(`⚠️ No saving activity found with reference: ${reference}`);
  } else {
    console.log(`🔄 Payment status updated to '${newStatus}' for reference: ${reference}`);
  }
}

router.post('/payment-webhook', async (req, res) => {
  const requestHash = req.get('X-Paypack-Signature');
  const secret = process.env.PAYPACK_WEBHOOK_SIGN_KEY;

  if (!requestHash || !secret) {
    console.warn('🚫 Missing Paypack signature or secret');
    return res.status(400).json({ message: 'Signature verification failed.' });
  }

  const computedHash = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('base64');

  if (computedHash !== requestHash) {
    console.warn('🚫 Invalid webhook signature — rejected.');
    return res.status(403).json({ message: 'Invalid signature.' });
  }

  console.log('📩 Valid webhook received from Paypack.');

  try {
    const { ref, status } = req.body;

    if (!ref || !status) {
      return res.status(400).json({ message: 'Invalid webhook payload.' });
    }

    const statusLower = status.toLowerCase();

    // Update DB
    await updatePaymentStatusInDb(ref, statusLower);

    // Fetch member details
    await poolConnect;
    const request = pool.request();
    const result = await request
      .input('reference', sql.VarChar(100), ref)
      .query(`
        SELECT member_id, phone_used, saved_amount, slot_id
        FROM member_saving_activities
        WHERE momo_reference_id = @reference
      `);

    if (result.recordset.length === 0) {
      console.warn(`⚠️ No saving activity found for webhook ref: ${ref}`);
      return res.status(200).json({ message: 'No matching saving activity.' });
    }

    const saving = result.recordset[0];

    // Send SMS Notification
    let sms = '';
    if (statusLower === 'successful') {
      sms = `Hello! Your saving of ${saving.saved_amount} RWF for slot ${saving.slot_id} has been confirmed successfully. Thank you!`;
    } else if (statusLower === 'failed') {
      sms = `Unfortunately, your saving payment for slot ${saving.slot_id} failed. Please try again.`;
    }

    if (sms) {
      await sendCustomSms(saving.phone_used, sms);
      console.log(`📤 SMS sent to ${saving.phone_used} regarding payment ${statusLower}`);
    }

    res.status(200).json({ message: 'Webhook processed successfully.' });
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(500).json({ message: 'Internal error', error: err.message });
  }
});


// === /newSaving route ===
router.post('/newSaving', async (req, res) => {
  const { slot_id, member_id, amount, phone } = req.body;
  if (!slot_id || !member_id || !amount) {
    return res.status(400).json({ message: 'slot_id, member_id, and amount are required.' });
  }

  let phoneToUse = phone || (await getMemberPhone(member_id));
  if (!phoneToUse) {
    return res.status(400).json({ message: 'Phone number is required either in input or in member record.' });
  }

  // Fetch slot info and check duplicate save for this slot
  await poolConnect;
  const transaction = new sql.Transaction(pool);
  let slotResult;
  try {
    await transaction.begin();

    slotResult = await transaction.request()
      .input('slot_id', sql.Int, slot_id)
      .query(`
        SELECT s.slot_id, s.slot_date, s.slot_time, s.iki_id, s.round_id,
               sr.saving_ratio, sr.time_delay_penalty, sr.date_delay_penalty, sr.time_limit_minutes,
               r.round_status, i.iki_name, l.cell, l.village, i.iki_email
        FROM ikimina_saving_slots s
        JOIN dbo.ikimina_rounds r ON s.round_id = r.round_id
        LEFT JOIN ikimina_saving_rules sr ON s.iki_id = sr.iki_id AND s.round_id = sr.round_id
        JOIN ikimina_info i ON s.iki_id = i.iki_id
        JOIN ikimina_locations l ON i.location_id = l.location_id
        WHERE s.slot_id = @slot_id
      `);

    if (!slotResult.recordset.length) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Slot not found.' });
    }

    const duplicateCheck = await pool.request()
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .query(`SELECT * FROM member_saving_activities WHERE slot_id = @slot_id AND member_id = @member_id`);
    if (duplicateCheck.recordset.length > 0) {
      await transaction.rollback();
      return res.status(409).json({ message: 'You already saved for this slot.' });
    }

    await transaction.commit();

  } catch (err) {
    try { await transaction.rollback(); } catch {}
    console.error('DB error during slot fetch or duplicate check:', err);
    return res.status(500).json({ message: 'Database error.', error: err.message });
  }

  // Initiate payment
  let paypackResponse;
  try {
    paypackResponse = await cashin({
      amount,
      phone: phoneToUse,
      idempotencyKey: `${slot_id}_${member_id}_${Date.now()}`.slice(0, 32),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to initiate payment.', error: err.message });
  }

  const paymentRef = paypackResponse.ref || paypackResponse.reference || paypackResponse.id;
  if (!paymentRef) {
    return res.status(500).json({ message: 'Payment reference missing from payment response.' });
  }

  // Poll payment status with timeout and retry
  let status = 'pending';
  let attempts = 0;
  await new Promise(r => setTimeout(r, 5000));
  while (status === 'pending' && attempts < 10) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const statusResult = await getTransactionStatus(paymentRef);
      status = statusResult.status.toLowerCase();
    } catch (err) {
      if ((err.response?.data?.message || '').toLowerCase().includes('not found')) {
        attempts++;
        continue;
      }
      return res.status(500).json({ message: 'Error checking payment status.', error: err.message });
    }
    attempts++;
  }

  // Fallback to transaction events if still not successful
  if (status !== 'successful') {
    try {
      const eventResult = await getTransactionEvents({
        referenceKey: paymentRef,
        phone: phoneToUse,
      });

      console.log('🔁 Transaction Events Response:', JSON.stringify(eventResult, null, 2));

      const successfulEvent = eventResult.transactions?.find(
        (event) => event.data?.status?.toLowerCase() === 'successful'
      );

      if (successfulEvent) {
        console.log('✅ Fallback: Found successful transaction in events.');
        status = 'successful';
      } else {
        console.warn('⚠️ Fallback: No successful transaction found in events.');
        // Insert pending saving and notify member about pending confirmation
        return await handlePendingSaving();
      }
    } catch (err) {
      console.error('❌ Error during transaction events fallback:', err.message);
      return res.status(500).json({
        message: 'Payment status uncertain and failed to retrieve transaction events.',
        error: err.message,
      });
    }
  }

  // If payment successful, insert record and notify member accordingly
  if (status === 'successful') {
    return await handleSuccessfulSaving();
  }

  // Fallback function for pending saving insertion and notification
async function handlePendingSaving() {
  const transaction2 = new sql.Transaction(pool);
  try {
    await transaction2.begin();

    const slot = slotResult.recordset[0];
    const nowKigali = dayjs().tz('Africa/Kigali');
    const savedAt = nowKigali.format('YYYY-MM-DD HH:mm:ss');
    const nowUtc = nowKigali.utc();
    const slotDate = dayjs(slot.slot_date).tz('Africa/Kigali');
    const slotTimeStr = typeof slot.slot_time === 'string' ? slot.slot_time : slot.slot_time.toISOString().substr(11, 8);
    const scheduledKigali = dayjs.tz(`${dayjs(slot.slot_date).format('YYYY-MM-DD')}T${slotTimeStr}`, 'Africa/Kigali');
    const deadlineUtc = scheduledKigali.add(slot.time_limit_minutes || 0, 'minute').utc();

    let isLate = false;
    let penaltyAmount = 0;
    let penaltyType = null;

    if (nowKigali.isSame(slotDate, 'day') && nowUtc.isAfter(deadlineUtc)) {
      isLate = true;
      penaltyType = 'time';
      penaltyAmount = slot.time_delay_penalty || 0;
    } else if (nowKigali.isAfter(slotDate, 'day')) {
      isLate = true;
      penaltyType = 'date';
      penaltyAmount = slot.date_delay_penalty || 0;
    }

    const insertSaving = await transaction2.request()
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .input('saved_amount', sql.Decimal(10, 2), amount)
      .input('phone_used', sql.VarChar(15), phoneToUse)
      .input('saved_at', sql.DateTime, savedAt)
      .input('penalty_applied', sql.Decimal(10, 2), penaltyAmount)
      .input('is_late', sql.Bit, isLate ? 1 : 0)
      .input('momo_reference_id', sql.VarChar(100), paymentRef)
      .input('payment_status', sql.VarChar(50), 'pending')
      .query(`
        INSERT INTO member_saving_activities (
          slot_id, member_id, saved_amount, phone_used, saved_at,
          penalty_applied, is_late, momo_reference_id, payment_status
        )
        OUTPUT inserted.save_id
        VALUES (
          @slot_id, @member_id, @saved_amount, @phone_used, @saved_at,
          @penalty_applied, @is_late, @momo_reference_id, @payment_status
        )
      `);

    const save_id = insertSaving.recordset[0].save_id;

    if (isLate) {
      const actualSavingTime = new Date(Date.UTC(1970, 0, 1, nowUtc.hour(), nowUtc.minute(), nowUtc.second()));
      const allowedTimeLimit = new Date(Date.UTC(1970, 0, 1, deadlineUtc.hour(), deadlineUtc.minute(), deadlineUtc.second()));

      await transaction2.request()
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
        .input('created_at', sql.DateTime, nowUtc.toDate())
        .input('is_paid', sql.Bit, 0)
        .input('paid_at', sql.DateTime, null)
        .query(`
          INSERT INTO penalty_logs (
            save_id, member_id, iki_id, slot_id,
            penalty_type, penalty_amount, rule_time_limit_minutes,
            actual_saving_time, allowed_time_limit, saving_date,
            created_at, is_paid, paid_at
          ) VALUES (
            @save_id, @member_id, @iki_id, @slot_id,
            @penalty_type, @penalty_amount, @rule_time_limit_minutes,
            @actual_saving_time, @allowed_time_limit, @saving_date,
            @created_at, @is_paid, @paid_at
          )
        `);
    }

    await transaction2.commit();

    const sms = isLate
      ? `Your saving of ${amount} RWF for ${slot.iki_name} has been received and is pending confirmation. ⚠️ A penalty of ${penaltyAmount} may apply.`
      : `Your saving of ${amount} RWF for ${slot.iki_name} has been received and is pending confirmation.`;

    sendCustomSms(phoneToUse, sms);
    sendCustomEmail(slot.iki_email, 'Saving Pending Confirmation', sms);

    return res.status(202).json({
      message: 'Saving received and pending confirmation.',
      save_id,
      penalty_applied: penaltyAmount,
      is_late: isLate,
    });
  } catch (err) {
    try { await transaction2.rollback(); } catch {}
    console.error('Error inserting pending saving:', err);
    return res.status(500).json({ message: 'Error saving saving activity.', error: err.message });
  }
}

// Function to handle successful saving insertion and notification
async function handleSuccessfulSaving() {
  const transaction2 = new sql.Transaction(pool);
  try {
    await transaction2.begin();

    const slot = slotResult.recordset[0];
    const nowKigali = dayjs().tz('Africa/Kigali');
    const savedAt = nowKigali.format('YYYY-MM-DD HH:mm:ss');
    const scheduledTime = dayjs(`${slot.slot_date}T${slot.slot_time}`, 'Africa/Kigali');
    const deadlineUtc = scheduledTime.add(slot.time_limit_minutes || 0, 'minute').utc();

    const isLate = nowKigali.isAfter(dayjs(slot.slot_date).endOf('day'));
    let penaltyType = null;
    let penaltyAmount = 0;

    if (isLate) {
      const nowUtc = nowKigali.utc();
      if (nowKigali.isSame(dayjs(slot.slot_date), 'day') && nowUtc.isAfter(deadlineUtc)) {
        penaltyType = 'time';
        penaltyAmount = slot.time_delay_penalty || 0;
      } else {
        penaltyType = 'date';
        penaltyAmount = slot.date_delay_penalty || 0;
      }
    }

    const insertSaving = await transaction2.request()
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .input('saved_amount', sql.Decimal(10, 2), amount)
      .input('phone_used', sql.VarChar(15), phoneToUse)
      .input('saved_at', sql.DateTime, savedAt)
      .input('penalty_applied', sql.Decimal(10, 2), penaltyAmount)
      .input('is_late', sql.Bit, isLate ? 1 : 0)
      .input('momo_reference_id', sql.VarChar(100), paymentRef)
      .input('payment_status', sql.VarChar(50), 'successful')
      .query(`
        INSERT INTO member_saving_activities (
          slot_id, member_id, saved_amount, phone_used, saved_at,
          penalty_applied, is_late, momo_reference_id, payment_status
        )
        OUTPUT inserted.save_id
        VALUES (@slot_id, @member_id, @saved_amount, @phone_used, @saved_at,
                @penalty_applied, @is_late, @momo_reference_id, @payment_status)
      `);

    const save_id = insertSaving.recordset[0].save_id;

    // Insert full penalty if late
    if (isLate) {
      const nowUtc = nowKigali.utc();
      const actualSavingTime = new Date(Date.UTC(1970, 0, 1, nowUtc.hour(), nowUtc.minute(), nowUtc.second()));
      const allowedTimeLimit = new Date(Date.UTC(1970, 0, 1, deadlineUtc.hour(), deadlineUtc.minute(), deadlineUtc.second()));

      await transaction2.request()
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
        .input('created_at', sql.DateTime, nowUtc.toDate())
        .input('is_paid', sql.Bit, 0)
        .input('paid_at', sql.DateTime, null)
        .query(`
          INSERT INTO penalty_logs (
            save_id, member_id, iki_id, slot_id,
            penalty_type, penalty_amount, rule_time_limit_minutes,
            actual_saving_time, allowed_time_limit, saving_date,
            created_at, is_paid, paid_at
          ) VALUES (
            @save_id, @member_id, @iki_id, @slot_id,
            @penalty_type, @penalty_amount, @rule_time_limit_minutes,
            @actual_saving_time, @allowed_time_limit, @saving_date,
            @created_at, @is_paid, @paid_at
          )
        `);
    }

    await transaction2.commit();

    // Notify member
    const sms = isLate
      ? `Thanks! Your ${amount} RWF saving for ${slot.iki_name} was recorded. ⚠️ A penalty of ${penaltyAmount} was applied due to late saving.`
      : `Thanks! Your ${amount} RWF saving for ${slot.iki_name} has been recorded successfully.`;

    sendCustomSms(phoneToUse, sms);
    sendCustomEmail(slot.iki_email, isLate ? 'Saving with Penalty' : 'Saving Confirmed', sms);

    return res.status(201).json({
      message: 'Saving completed successfully.',
      save_id,
      penalty_applied: penaltyAmount,
      is_late: isLate,
    });
  } catch (err) {
    try { await transaction2.rollback(); } catch {}
    console.error('Error inserting successful saving:', err);
    return res.status(500).json({ message: 'Error saving saving activity.', error: err.message });
  }
}

});






// === /payPenalty route ===
router.post('/payPenalty', async (req, res) => {
  await poolConnect;
  const transaction = new sql.Transaction(pool);
  const { slot_id, member_id, phone } = req.body;

  if (!slot_id || !member_id) {
    return res.status(400).json({ message: 'Missing required fields: slot_id and member_id.' });
  }

  let phoneToUse = phone || (await getMemberPhone(member_id));
  phoneToUse = normalizePhone(phoneToUse);
  if (!phoneToUse) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  try {
    // Check unpaid penalty
    const checkResult = await pool.request()
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .query(`
        SELECT * FROM member_penalty_log 
        WHERE slot_id = @slot_id AND member_id = @member_id AND is_paid = 0
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'No unpaid penalty found.' });
    }

    const penaltyRecord = checkResult.recordset[0];
    const penaltyAmount = penaltyRecord.penalty_amount;

    // Get member info for notifications

    // Get member info for notifications
    const memberInfoResult = await pool.request()
      .input('member_id', sql.Int, member_id)
      .query(`
        SELECT member_phone_number, member_email, member_names 
        FROM ims_db.dbo.members_info 
        WHERE member_id = @member_id
      `);

    if (memberInfoResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    const { member_phone_number, member_email, member_names } = memberInfoResult.recordset[0];
    const finalPhone = phoneToUse || normalizePhone(member_phone_number);

    // Initiate payment with PayPack
    let paypackResponse;
    try {
      paypackResponse = await cashin({
        amount: penaltyAmount,
        phone: finalPhone,
        idempotencyKey: `penalty_${slot_id}_${member_id}_${Date.now()}`.slice(0, 32),
      });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to initiate payment.', error: err.message });
    }

    // Poll payment status with retries
    let status = 'pending';
    let attempts = 0;
    const paymentRef = paypackResponse.ref || paypackResponse.reference || paypackResponse.id;

    await new Promise(r => setTimeout(r, 3000)); // Initial wait before polling

    while (status.toLowerCase() === 'pending' && attempts < 10) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const statusResult = await getTransactionStatus(paymentRef);
        status = statusResult.status.toLowerCase();
      } catch (err) {
        return res.status(500).json({ message: 'Error checking payment status.', error: err.message });
      }
      attempts++;
    }

    if (status !== 'successful') {
      return res.status(400).json({ message: `Payment failed or timed out. Status: ${status}` });
    }

    // Log payment asynchronously
    logPayment({
      reference: paymentRef,
      phone: finalPhone,
      amount: penaltyAmount,
      status: status.toUpperCase(),
      type: 'penalty',
      member_id,
      slot_id,
      raw_response: paypackResponse,
    }).catch(e => console.warn('Log payment error:', e.message));

    // Update penalty_logs to mark penalty as paid
    await transaction.begin();
    const paidAt = dayjs().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss');

    await transaction.request()
      .input('paid_at', sql.DateTime, paidAt)
      .input('momo_reference_id', sql.VarChar(100), paymentRef)
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .query(`
        UPDATE member_penalty_log
        SET is_paid = 1, paid_at = @paid_at, momo_reference_id = @momo_reference_id
        WHERE slot_id = @slot_id AND member_id = @member_id AND is_paid = 0
      `);

    await transaction.commit();

    // Notify user by SMS and email
    const message = `Hello ${member_names}, your penalty of ${penaltyAmount} RWF for slot ${slot_id} has been paid successfully.`;
    await Promise.allSettled([
      sendCustomSms(finalPhone, message),
      sendCustomEmail(member_email, 'Penalty Paid', message),
    ]);

    return res.status(200).json({
      message: `Penalty paid successfully by ${member_names}.`,
      payment_reference: paymentRef,
    });

  } catch (err) {
    if (!transaction._aborted) {
      try { await transaction.rollback(); } catch {}
    }
    console.error('Error during penalty payment:', err);
    return res.status(500).json({ message: 'Internal server error.', error: err.message });
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
  }
});

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


router.get('/allMemberSavings/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  try {
    await poolConnect;
    const result = await pool.request()
      .input('iki_id', sql.Int, iki_id)
      .query(`
        SELECT 
         SELECT 
  m.member_id,
  m.member_names,
  m.member_phone_number,
  ISNULL(SUM(s.saved_amount), 0) AS total_savings,
  ISNULL(COUNT(CASE WHEN s.penalty_applied = 1 THEN 1 END), 0) AS total_penalties,
  ISNULL(SUM(l.approved_amount), 0) AS total_approved_loans,
  ISNULL(SUM(CASE WHEN l.status IN ('approved', 'disbursed') THEN l.approved_amount ELSE 0 END), 0) AS active_loans
FROM dbo.members_info m
LEFT JOIN dbo.member_saving_activities s ON m.member_id = s.member_id
LEFT JOIN dbo.loans l ON m.member_id = l.member_id
WHERE m.iki_id = @iki_id
GROUP BY m.member_id, m.member_names, m.member_phone_number
ORDER BY total_savings DESC;

      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error fetching member savings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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
      (SELECT TOP 1 slot_date FROM SlotsWithSavingsAndPenalties WHERE slot_date > CONVERT(date, @now) ORDER BY slot_date ASC) AS next_upcoming_slot_date,

      -- New counts for member and group completed slots
      (SELECT COUNT(DISTINCT sa.slot_id)
       FROM member_saving_activities sa
       JOIN ikimina_saving_slots s2 ON sa.slot_id = s2.slot_id
       WHERE sa.member_id = @memberId AND s2.iki_id = @ikiId AND s2.slot_date <= CONVERT(date, @now)
      ) AS member_completed_slots,

      (SELECT COUNT(DISTINCT sa.slot_id)
       FROM member_saving_activities sa
       JOIN ikimina_saving_slots s2 ON sa.slot_id = s2.slot_id
       WHERE s2.iki_id = @ikiId AND s2.slot_date <= CONVERT(date, @now)
      ) AS group_completed_slots

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
      member_completed_slots: result.recordset[0].member_completed_slots,
      group_completed_slots: result.recordset[0].group_completed_slots,
    };

    const slots = result.recordset.map(({
      total_saved_amount, slots_completed, total_slots,
      total_penalties_paid, total_penalties_unpaid,
      average_saving_amount, most_recent_saving_at,
      next_upcoming_slot_date, member_completed_slots, group_completed_slots, ...slot
    }) => slot);

    res.json({ slots, aggregates });
  } catch (error) {
    console.error('Error fetching member saving summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// 1. Summary Data for All Members in Ikimina
router.get('/ikimina/:iki_id/summary', async (req, res) => {
  const { iki_id } = req.params;
  try {
    await poolConnect;
    const request = pool.request();
    request.input('iki_id', sql.Int, iki_id);
    const result = await request.query(`
      SELECT 
        m.member_id,
        m.member_names,
        m.member_phone_number,
        ISNULL(SUM(s.saved_amount), 0) AS total_savings,
        ISNULL(COUNT(CASE WHEN s.penalty_applied = 1 THEN 1 END), 0) AS total_penalties,
        ISNULL(SUM(l.approved_amount), 0) AS total_approved_loans,
        ISNULL(SUM(CASE WHEN l.status IN ('approved', 'disbursed') THEN l.approved_amount ELSE 0 END), 0) AS active_loans
      FROM dbo.members_info m
      LEFT JOIN dbo.member_saving_activities s ON m.member_id = s.member_id
      LEFT JOIN dbo.loans l ON m.member_id = l.member_id
      WHERE m.iki_id = @iki_id
      GROUP BY m.member_id, m.member_names, m.member_phone_number
      ORDER BY total_savings DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
});

// 2. Saving Activities Table
router.get('/savings/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    await poolConnect;
    const request = pool.request();
    request.input('iki_id', sql.Int, iki_id);
    const result = await request.query(`
      SELECT TOP 1000 s.*
      FROM dbo.member_saving_activities s
      JOIN dbo.members_info m ON m.member_id = s.member_id
      WHERE m.iki_id = @iki_id
      ORDER BY s.saved_at DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching savings:', err);
    res.status(500).json({ message: 'Failed to fetch saving activities' });
  }
});

// 3. Loan Interest
router.get('/loan-interest/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    await poolConnect;
    const request = pool.request();
    request.input('iki_id', sql.Int, iki_id);
    const result = await request.query(`
      SELECT TOP 1000 li.*
      FROM dbo.loan_interest li
      JOIN dbo.loans l ON l.loan_id = li.loan_id
      JOIN dbo.members_info m ON m.member_id = l.member_id
      WHERE m.iki_id = @iki_id
      ORDER BY li.calculated_on_date DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching interest:', err);
    res.status(500).json({ message: 'Failed to fetch loan interest' });
  }
});

// 4. Loan Repayments
router.get('/loan-repayments/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    await poolConnect;
    const request = pool.request();
    request.input('iki_id', sql.Int, iki_id);
    const result = await request.query(`
      SELECT TOP 1000 lr.*
      FROM dbo.loan_repayments lr
      JOIN dbo.members_info m ON m.member_id = lr.member_id
      WHERE m.iki_id = @iki_id
      ORDER BY lr.payment_date DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching repayments:', err);
    res.status(500).json({ message: 'Failed to fetch loan repayments' });
  }
});


// 5. Loans
router.get('/loans/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    await poolConnect;
    const request = pool.request();
    request.input('iki_id', sql.Int, iki_id);
    const result = await request.query(`
      SELECT TOP 1000 l.*
      FROM dbo.loans l
      JOIN dbo.members_info m ON m.member_id = l.member_id
      WHERE m.iki_id = @iki_id
      ORDER BY l.created_at DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching loans:', err);
    res.status(500).json({ message: 'Failed to fetch loans' });
  }
});

// 6. Saving Slots
router.get('/saving-slots/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    await poolConnect;
    const request = pool.request();
    request.input('iki_id', sql.Int, iki_id);
    const result = await request.query(`
      SELECT TOP 1000 *
      FROM dbo.ikimina_saving_slots
      WHERE iki_id = @iki_id
      ORDER BY slot_date DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching slots:', err);
    res.status(500).json({ message: 'Failed to fetch saving slots' });
  }
});

module.exports = router;