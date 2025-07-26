const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');
const { sendCustomSms, sendCustomEmail } = require('./notification');
const { cashin, getTransactionStatus, getTransactionEvents } = require('./moMoPayment');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isBetween = require('dayjs/plugin/isBetween');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(isBetween); 

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


/* The above code is a JavaScript function that handles a POST request to create a new saving record in
a database. Here is a summary of what the code does: */
// router.post('/newSaving', async (req, res) => {
//   await poolConnect;
//   const { slot_id, member_id, amount, phone_used } = req.body;

//   if (!slot_id || !member_id || !amount) {
//     return res.status(400).json({
//       message: 'Missing required fields: slot_id, member_id, and amount are all required.'
//     });
//   }

//   try {
//     // Current time in UTC for storing consistently
//     const nowUtc = dayjs().utc();

//     // For user-facing displays, convert UTC to Kigali timezone
//     const nowKigali = nowUtc.tz('Africa/Kigali');

//     // Fetch slot and related info including saving rules
//     const slotQuery = `
//       SELECT s.slot_id, s.slot_date, s.slot_time, s.iki_id, s.round_id,
//              sr.saving_ratio, sr.time_delay_penalty, sr.date_delay_penalty, sr.time_limit_minutes,
//              r.round_status,
//              i.iki_name,
//              l.cell,
//              l.village
//       FROM ikimina_saving_slots s
//       JOIN dbo.ikimina_rounds r ON s.round_id = r.round_id
//       LEFT JOIN ikimina_saving_rules sr ON s.iki_id = sr.iki_id AND s.round_id = sr.round_id
//       JOIN ikimina_info i ON s.iki_id = i.iki_id
//       JOIN ikimina_locations l ON i.location_id = l.location_id
//       WHERE s.slot_id = @slot_id
//     `;

//     const [slot] = await runQuery(slotQuery, [{ name: 'slot_id', type: sql.Int, value: slot_id }]);
//     if (!slot) return res.status(404).json({ message: 'Invalid slot. The specified slot was not found.' });
//     if (slot.round_status !== 'active') return res.status(400).json({ message: 'You cannot save to this round because it is not active.' });

//     if (amount < slot.saving_ratio || amount % slot.saving_ratio !== 0) {
//       return res.status(400).json({
//         message: `Saving amount must be at least ${slot.saving_ratio} and a multiple of ${slot.saving_ratio}.`
//       });
//     }

//     // Check if member already saved for this slot
//     const existingSave = await runQuery(
//       `SELECT 1 FROM member_saving_activities WHERE slot_id = @slot_id AND member_id = @member_id`,
//       [
//         { name: 'slot_id', type: sql.Int, value: slot_id },
//         { name: 'member_id', type: sql.Int, value: member_id }
//       ]
//     );
//     if (existingSave.length > 0) return res.status(400).json({ message: 'You have already saved for this slot.' });

//     // Get phone number if not provided
//     let phoneToUse = phone_used || await getMemberPhone(member_id);

//     // Prepare slot time string HH:mm:ss
//     let slotTimeStr = null;
//     if (slot.slot_time) {
//       if (typeof slot.slot_time === 'string') {
//         slotTimeStr = slot.slot_time.length >= 8 ? slot.slot_time.substr(0, 8) : null;
//       } else if (slot.slot_time instanceof Date) {
//         slotTimeStr = slot.slot_time.toISOString().substr(11, 8);
//       }
//     }

//     // Scheduled datetime (slot_date + slot_time) in Kigali timezone, then convert to UTC for comparison/storage
//     const scheduledKigali = dayjs.tz(`${dayjs(slot.slot_date).format('YYYY-MM-DD')}T${slotTimeStr}`, 'Africa/Kigali');
//     const scheduledUtc = scheduledKigali.utc();

//     // Deadline is scheduled time + time limit (in minutes), in UTC
//     const deadlineUtc = scheduledUtc.add(slot.time_limit_minutes || 0, 'minute');

//     // Prepare date-only for penalty logic
//     const slotDate = scheduledKigali.startOf('day');
//     const nowDate = nowKigali.startOf('day');

//     let penaltyType = null, penaltyAmount = 0, isLate = 0;

//     if (nowDate.isBefore(slotDate)) {
//       // Saved early, no penalty
//       isLate = 0;
//     } else if (nowDate.isSame(slotDate)) {
//       // Same day → check time deadline
//       if (nowUtc.isAfter(deadlineUtc)) {
//         penaltyType = 'time';
//         penaltyAmount = slot.time_delay_penalty || 0;
//         isLate = 1;
//       }
//     } else {
//       // Saved on a future day after scheduled date → date penalty
//       penaltyType = 'date';
//       penaltyAmount = slot.date_delay_penalty || 0;
//       isLate = 1;
//     }

//     // Insert saving record (store UTC time)
//     const insertResult = await pool.request()
//       .input('slot_id', sql.Int, slot_id)
//       .input('member_id', sql.Int, member_id)
//       .input('saved_amount', sql.Decimal(10, 2), amount)
//       .input('phone_used', sql.VarChar(20), phoneToUse)
//       .input('saved_at', sql.DateTime, nowUtc.toDate()) // store in UTC
//       .input('penalty_applied', sql.Decimal(10, 2), penaltyAmount)
//       .input('is_late', sql.Bit, isLate)
//       .query(`
//         INSERT INTO member_saving_activities (
//           slot_id, member_id, saved_amount, phone_used, saved_at, penalty_applied, is_late
//         )
//         OUTPUT inserted.save_id
//         VALUES (@slot_id, @member_id, @saved_amount, @phone_used, @saved_at, @penalty_applied, @is_late)
//       `);

//     const save_id = insertResult.recordset[0].save_id;

//     // Log penalty details if late
//     if (isLate === 1) {
//       // Actual saving time and allowed deadline as SQL Time types (store only time part, in UTC)
//       const actualSavingTime = new Date(Date.UTC(1970, 0, 1, nowUtc.hour(), nowUtc.minute(), nowUtc.second()));
//       const allowedTimeLimit = new Date(Date.UTC(1970, 0, 1, deadlineUtc.hour(), deadlineUtc.minute(), deadlineUtc.second()));

//       await pool.request()
//         .input('save_id', sql.Int, save_id)
//         .input('member_id', sql.Int, member_id)
//         .input('iki_id', sql.Int, slot.iki_id)
//         .input('slot_id', sql.Int, slot.slot_id)
//         .input('penalty_type', sql.VarChar(10), penaltyType)
//         .input('penalty_amount', sql.Decimal(10, 2), penaltyAmount)
//         .input('rule_time_limit_minutes', sql.Int, slot.time_limit_minutes)
//         .input('actual_saving_time', sql.Time, actualSavingTime)
//         .input('allowed_time_limit', sql.Time, allowedTimeLimit)
//         .input('saving_date', sql.Date, nowUtc.format('YYYY-MM-DD'))
//         .query(`
//           INSERT INTO penalty_logs (
//             save_id, member_id, iki_id, slot_id,
//             penalty_type, penalty_amount, rule_time_limit_minutes,
//             actual_saving_time, allowed_time_limit, saving_date
//           ) VALUES (
//             @save_id, @member_id, @iki_id, @slot_id,
//             @penalty_type, @penalty_amount, @rule_time_limit_minutes,
//             @actual_saving_time, @allowed_time_limit, @saving_date
//           )
//         `);
//     }

//     // Fetch member info for notifications
//     const memberQuery = `
//       SELECT member_names AS member_name, member_email, member_phone_number
//       FROM members_info
//       WHERE member_id = @member_id
//     `;
//     const [memberInfo] = await runQuery(memberQuery, [{ name: 'member_id', type: sql.Int, value: member_id }]);

//     const locationString = `${slot.cell}, ${slot.village}`;

//     // Format times in Kigali timezone for user display
//     const scheduledDisplay = scheduledKigali.format('YYYY-MM-DD HH:mm:ss');
//     const actualSavingDisplay = nowKigali.format('YYYY-MM-DD HH:mm:ss');
//     const deadlineDisplay = deadlineUtc.tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss');

//     let smsText = `Dear ${memberInfo.member_name}, your saving of ${amount} RWF on "${slot.iki_name}" at "${locationString}" on ${scheduledDisplay} was recorded successfully. Thank you!`;

//     let emailHtml = `
//       <p>Dear ${memberInfo.member_name},</p>
//       <p>Your saving of <strong>${amount}</strong> on <strong>${slot.iki_name}</strong> located at <strong>${locationString}</strong> on <strong>${scheduledDisplay}</strong> has been recorded successfully.</p>
//       <p>Thank you for saving with us!</p>
//     `;

//     if (isLate === 1) {
//       const penaltyReason = penaltyType === 'date'
//         ? 'You saved after your group’s scheduled date'
//         : 'You saved after the allowed time';

//       smsText = `Dear ${memberInfo.member_name}, your saving of ${amount} for Ikimina "${slot.iki_name}" at "${locationString}" was recorded, but ⚠️ penalty of ${penaltyAmount} applied due to ${penaltyReason}. Scheduled: ${scheduledDisplay}, Actual: ${actualSavingDisplay}, Deadline: ${deadlineDisplay}.`;

//       emailHtml = `
//         <p>Dear ${memberInfo.member_name},</p>
//         <p>Your saving of <strong>${amount}</strong> for Ikimina <strong>${slot.iki_name}</strong> located at <strong>${locationString}</strong> has been recorded.</p>
//         <p><strong>Penalty applied:</strong> ${penaltyAmount}</p>
//         <p>Reason: ${penaltyReason}</p>
//         <p>Scheduled Date & Time: ${scheduledDisplay}</p>
//         <p>Actual Saving Date & Time: ${actualSavingDisplay}</p>
//         <p>Allowed Deadline: ${deadlineDisplay}</p>
//         <p>Thank you for saving with us!</p>
//       `;
//     }

//     // Send notifications
//     let smsSent = 0, emailSent = 0, smsError = null, emailError = null;

//     try {
//       const [smsResult, emailResult] = await Promise.allSettled([
//         sendCustomSms(phoneToUse, smsText),
//         sendCustomEmail(memberInfo.member_email, `Saving Confirmation for Ikimina "${slot.iki_name}"`, emailHtml),
//       ]);

//       smsSent = smsResult.status === 'fulfilled' ? 1 : 0;
//       emailSent = emailResult.status === 'fulfilled' ? 1 : 0;

//       smsError = smsSent ? null : (smsResult.reason?.message || 'Unknown SMS error');
//       emailError = emailSent ? null : (emailResult.reason?.message || 'Unknown Email error');
//     } catch (notifyErr) {
//       console.error('Notification error:', notifyErr);
//       smsSent = 0;
//       emailSent = 0;
//       smsError = emailError = notifyErr.message || 'Unknown notification error';
//     }

//     // Log notification results
//     await pool.request()
//       .input('save_id', sql.Int, save_id)
//       .input('member_id', sql.Int, member_id)
//       .input('iki_id', sql.Int, slot.iki_id)
//       .input('slot_id', sql.Int, slot.slot_id)
//       .input('sms_sent', sql.Bit, smsSent)
//       .input('email_sent', sql.Bit, emailSent)
//       .input('sms_error', sql.NVarChar(sql.MAX), smsError)
//       .input('email_error', sql.NVarChar(sql.MAX), emailError)
//       .query(`
//         INSERT INTO notification_logs
//         (save_id, member_id, iki_id, slot_id, sms_sent, email_sent, sms_error, email_error, sent_at)
//         VALUES
//         (@save_id, @member_id, @iki_id, @slot_id, @sms_sent, @email_sent, @sms_error, @email_error, GETDATE())
//       `);

//     res.json({
//       message: 'Saving submitted successfully.',
//       save_id,
//       penalty_applied: penaltyAmount,
//       is_late: !!isLate,
//       phone_used: phoneToUse,
//       notification: { smsSent: !!smsSent, emailSent: !!emailSent }
//     });

//   } catch (err) {
//     console.error('POST saveSlot error:', err);
//     let message = 'An unexpected error occurred while processing your saving.';

//     if (err.message.includes('Conversion failed')) {
//       message = 'Invalid data format. Please verify the saving amount and phone number.';
//     } else if (err.message.includes('Violation of UNIQUE KEY')) {
//       message = 'You already submitted a saving for this slot.';
//     } else if (err.message.includes('Cannot insert the value NULL')) {
//       message = 'Some required fields are missing or incorrect.';
//     }

//     res.status(500).json({ message });
//   }
// });

// // === Pay Penalty Route ===
// router.post('/payPenalty', async (req, res) => {
//   await poolConnect;
//   const { slot_id, member_id } = req.body;

//   if (!slot_id || !member_id) {
//     return res.status(400).json({ message: 'Missing required fields: slot_id and member_id.' });
//   }

//   try {
//     const checkQuery = `
//       SELECT * FROM penalty_logs 
//       WHERE slot_id = @slot_id AND member_id = @member_id AND is_paid = 0
//     `;
//     const checkResult = await pool
//       .request()
//       .input('slot_id', sql.Int, slot_id)
//       .input('member_id', sql.Int, member_id)
//       .query(checkQuery);

//     if (checkResult.recordset.length === 0) {
//       return res.status(404).json({ message: 'Unpaid penalty not found for this member and slot.' });
//     }

//     const updateQuery = `
//       UPDATE penalty_logs 
//       SET is_paid = 1, paid_at = GETDATE() 
//       WHERE slot_id = @slot_id AND member_id = @member_id
//     `;
//     await pool
//       .request()
//       .input('slot_id', sql.Int, slot_id)
//       .input('member_id', sql.Int, member_id)
//       .query(updateQuery);

//     // Fetch member contact details
//     const memberQuery = `
//       SELECT member_phone_number, member_email, member_names 
//       FROM Members_info 
//       WHERE member_id = @member_id
//     `;
//     const memberInfo = await pool
//       .request()
//       .input('member_id', sql.Int, member_id)
//       .query(memberQuery);

//     if (memberInfo.recordset.length === 0) {
//       return res.status(404).json({ message: 'Member not found.' });
//     }

//     const { member_phone_number, member_email, member_names } = memberInfo.recordset[0];

//     // Construct message
//     const message = `Hello ${member_names}, your penalty for slot ${slot_id} has been marked as paid. Thank you.`;

//     // Send SMS & Email (parallel)
//     const [smsResult, emailResult] = await Promise.allSettled([
//       sendCustomSms(member_phone_number, message),
//       sendCustomEmail(member_email, 'Penalty Paid', message),
//     ]);

//     const smsSent = smsResult.status === 'fulfilled';
//     const smsError = smsSent ? null : smsResult.reason.message;

//     const emailSent = emailResult.status === 'fulfilled';
//     const emailError = emailSent ? null : emailResult.reason.message;


//     res.status(200).json({
//       message: `Penalty for ${member_names} has been paid successfully and notifications sent.`,
//       smsSent,
//       emailSent,
//       smsError,
//       emailError,
//     });

//   } catch (error) {
//     console.error('❌ Error processing penalty payment:', error);
//     res.status(500).json({ message: 'Internal server error.', error: error.message });
//   }
// });




// === /newSaving route with Real Payment Integration ===
// === MAIN ROUTE ===

// router.post('/newSaving', async (req, res) => {
//   const { slot_id, member_id, amount, phone } = req.body;
//   if (!slot_id || !member_id || !amount) {
//     return res.status(400).json({ message: 'slot_id, member_id, and amount are required.' });
//   }

//   let phoneToUse = phone || (await getMemberPhone(member_id));
//   if (!phoneToUse) {
//     return res.status(400).json({ message: 'Phone number is required.' });
//   }

//   await poolConnect;
//   const transaction = new sql.Transaction(pool);
//   let slotResult;

//   try {
//     await transaction.begin();

//     slotResult = await transaction.request()
//       .input('slot_id', sql.Int, slot_id)
//       .query(`
//         SELECT s.*, r.saving_ratio, r.time_limit_minutes, r.round_id
//         FROM ikimina_saving_slots s
//         JOIN ikimina_saving_rules r ON s.round_id = r.round_id
//         WHERE s.slot_id = @slot_id
//       `);

//     const duplicateCheck = await pool.request()
//       .input('slot_id', sql.Int, slot_id)
//       .input('member_id', sql.Int, member_id)
//       .query(`SELECT * FROM member_saving_activities WHERE slot_id = @slot_id AND member_id = @member_id`);
    
//     if (duplicateCheck.recordset.length > 0) {
//       await transaction.rollback();
//       return res.status(409).json({ message: 'You already saved for this slot.' });
//     }

//     await transaction.commit();
//   } catch (err) {
//     try { await transaction.rollback(); } catch {}
//     console.error('DB Transaction Error:', err);
//     return res.status(500).json({ message: 'DB error.', error: err.message });
//   }

//   // Step 2: Initiate cashin
//   let paypackResponse;
//   try {
//     paypackResponse = await cashin({
//       amount,
//       phone: phoneToUse,
//       idempotencyKey: `${slot_id}_${member_id}_${Date.now()}`.slice(0, 32),
//     });
//   } catch (err) {
//     return res.status(500).json({ message: 'Cashin failed.', error: err.message });
//   }

//   const paymentRef = paypackResponse.ref || paypackResponse.reference || paypackResponse.id;
//   if (!paymentRef) {
//     return res.status(500).json({ message: 'No payment reference returned.' });
//   }

//   // Step 3: Insert saving as pending
//   try {
//     await handlePendingSaving({
//       slotResult,  // <-- FIXED here
//       slot_id,
//       member_id,
//       amount,
//       phoneToUse,
//       paymentRef
//     });
//   } catch (err) {
//     return res.status(500).json({ message: 'Insert saving failed.', error: err.message });
//   }
//   // Respond immediately
//   return res.status(202).json({
//     message: 'Saving initiated. Please confirm payment on your phone.',
//     reference: paymentRef,
//   });
// });




router.post('/newSaving', async (req, res) => {
  const { slot_id, member_id, amount, phone } = req.body;
  if (!slot_id || !member_id || !amount) {
    return res.status(400).json({ message: 'slot_id, member_id, and amount are required.' });
  }

  await poolConnect;

  try {
    // Fetch slot and related info including saving rules and round status
    const slotResult = await pool.request()
      .input('slot_id', sql.Int, slot_id)
      .query(`
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
      `);

    if (!slotResult.recordset.length) {
      return res.status(404).json({ message: 'Invalid slot. The specified slot was not found.' });
    }

    const slot = slotResult.recordset[0];
    if (slot.round_status !== 'active') {
      return res.status(400).json({ message: 'You cannot save to this round because it is not active.' });
    }

    // Validate saving amount with saving_ratio
    if (amount < slot.saving_ratio || amount % slot.saving_ratio !== 0) {
      return res.status(400).json({
        message: `Saving amount must be at least ${slot.saving_ratio} and a multiple of ${slot.saving_ratio}.`
      });
    }

    // Check duplicate saving for this slot and member
    const duplicateCheck = await pool.request()
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .query(`SELECT 1 FROM member_saving_activities WHERE slot_id = @slot_id AND member_id = @member_id`);

    if (duplicateCheck.recordset.length > 0) {
      return res.status(409).json({ message: 'You already saved for this slot.' });
    }

    // Get phone to use
    const phoneToUse = phone || (await getMemberPhone(member_id));
    if (!phoneToUse) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }

    // Step 2: Initiate cashin payment
    let paypackResponse;
    try {
      paypackResponse = await cashin({
        amount,
        phone: phoneToUse,
        idempotencyKey: `${slot_id}_${member_id}_${Date.now()}`.slice(0, 32),
      });
    } catch (err) {
      return res.status(500).json({ message: 'Cashin failed.', error: err.message });
    }

    const paymentRef = paypackResponse.ref || paypackResponse.reference || paypackResponse.id;
    if (!paymentRef) {
      return res.status(500).json({ message: 'No payment reference returned.' });
    }

    // Calculate penalty and insert saving as pending, along with penalty logs if needed
    // Current time in UTC and Kigali timezone
    const nowUtc = dayjs().utc();
    const nowKigali = nowUtc.tz('Africa/Kigali');

    // Prepare slot time string HH:mm:ss
    let slotTimeStr = null;
    if (slot.slot_time) {
      if (typeof slot.slot_time === 'string') {
        slotTimeStr = slot.slot_time.length >= 8 ? slot.slot_time.substr(0, 8) : null;
      } else if (slot.slot_time instanceof Date) {
        slotTimeStr = slot.slot_time.toISOString().substr(11, 8);
      }
    }

    // Scheduled datetime in Kigali timezone and UTC
    const scheduledKigali = dayjs.tz(`${dayjs(slot.slot_date).format('YYYY-MM-DD')}T${slotTimeStr}`, 'Africa/Kigali');
    const scheduledUtc = scheduledKigali.utc();

    // Deadline is scheduled time + time limit in minutes
    const deadlineUtc = scheduledUtc.add(slot.time_limit_minutes || 0, 'minute');

    // Date-only for penalty logic
    const slotDate = scheduledKigali.startOf('day');
    const nowDate = nowKigali.startOf('day');

    let penaltyType = null, penaltyAmount = 0, isLate = 0;

    if (nowDate.isBefore(slotDate)) {
      // Early saving, no penalty
      isLate = 0;
    } else if (nowDate.isSame(slotDate)) {
      // Same day → check if after deadline
      if (nowUtc.isAfter(deadlineUtc)) {
        penaltyType = 'time';
        penaltyAmount = slot.time_delay_penalty || 0;
        isLate = 1;
      }
    } else {
      // Saved after scheduled date → date penalty
      penaltyType = 'date';
      penaltyAmount = slot.date_delay_penalty || 0;
      isLate = 1;
    }

    // Insert saving record as pending payment
    const insertResult = await pool.request()
      .input('slot_id', sql.Int, slot_id)
      .input('member_id', sql.Int, member_id)
      .input('saved_amount', sql.Decimal(10, 2), amount)
      .input('phone_used', sql.VarChar(20), phoneToUse)
      .input('saved_at', sql.DateTime, nowUtc.toDate())
      .input('penalty_applied', sql.Decimal(10, 2), penaltyAmount)
      .input('is_late', sql.Bit, isLate)
      .input('payment_status', sql.VarChar(20), 'pending')
      .input('momo_reference_id', sql.VarChar(100), paymentRef)
      .query(`
        INSERT INTO member_saving_activities
        (slot_id, member_id, saved_amount, phone_used, saved_at, penalty_applied, is_late, payment_status, momo_reference_id)
        OUTPUT inserted.save_id
        VALUES (@slot_id, @member_id, @saved_amount, @phone_used, @saved_at, @penalty_applied, @is_late, @payment_status, @momo_reference_id)
      `);

    const save_id = insertResult.recordset[0].save_id;

    // Log penalty if late
    if (isLate === 1) {
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
          INSERT INTO penalty_logs
          (save_id, member_id, iki_id, slot_id, penalty_type, penalty_amount, rule_time_limit_minutes, actual_saving_time, allowed_time_limit, saving_date)
          VALUES (@save_id, @member_id, @iki_id, @slot_id, @penalty_type, @penalty_amount, @rule_time_limit_minutes, @actual_saving_time, @allowed_time_limit, @saving_date)
        `);
    }

    // Fetch member info for notifications
    const memberQuery = `
      SELECT member_names AS member_name, member_email, member_phone_number
      FROM members_info
      WHERE member_id = @member_id
    `;
    const memberResult = await pool.request()
      .input('member_id', sql.Int, member_id)
      .query(memberQuery);

    const memberInfo = memberResult.recordset[0];
    const locationString = `${slot.cell}, ${slot.village}`;

    // Prepare notification messages
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
      const penaltyReason = penaltyType === 'date' ? 
        'You saved after your group’s scheduled date' : 
        'You saved after the allowed time';

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

    // Send notifications (async but await to catch errors)
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

    // Respond success
    return res.status(202).json({
      message: 'Saving initiated and recorded as pending payment. Please confirm payment on your phone.',
      reference: paymentRef,
      penalty_applied: penaltyAmount,
      is_late: !!isLate,
      notification: { smsSent: !!smsSent, emailSent: !!emailSent }
    });

  } catch (err) {
    console.error('Error in /newSaving:', err);
    return res.status(500).json({ message: 'An error occurred.', error: err.message });
  }
});


// Save to DB
// Save pending record
async function handlePendingSaving({ slotResult, slot_id, member_id, phoneToUse, amount, paymentRef }) {
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

  if (nowKigali.isSame(slotDate, 'day') && nowUtc.isAfter(deadlineUtc)) {
    isLate = true;
    penaltyAmount = slot.time_delay_penalty || 0;
  } else if (nowKigali.isAfter(slotDate, 'day')) {
    isLate = true;
    penaltyAmount = slot.date_delay_penalty || 0;
  }

  const result = await pool.request()
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
      ) OUTPUT inserted.save_id
      VALUES (
        @slot_id, @member_id, @saved_amount, @phone_used, @saved_at,
        @penalty_applied, @is_late, @momo_reference_id, @payment_status
      )
    `);

  return { save_id: result.recordset[0].save_id };
}


module.exports = router;