require('dotenv').config();
const fetch = require('node-fetch');
const { poolConnect, pool, sql } = require('../config/db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const KIGALI_TZ = 'Africa/Kigali';

const {
  sendCustomSms,
  sendCustomEmail,
} = require('../routes/notification'); // your notification module

const BACKEND_URL = 'http://localhost:5000/api/ikiminaRoundRoutes';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.warn('WARNING: AUTH_TOKEN environment variable is not set. Scheduler API calls may fail.');
}

const CHECK_INTERVAL = 60 * 1000; // 1 minute
const KIGALI_OFFSET_MS = 3 * 60 * 60 * 1000;

// In-memory cache to track last notified status for each round
const lastNotifiedStatus = {}; // key: round_id or 'no_rounds_iki_id', value: last notified status string

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function utcToKigali(date) {
  return new Date(date.getTime() + KIGALI_OFFSET_MS);
}

function getKigaliToday() {
  return startOfDay(utcToKigali(new Date()));
}

async function getAllIkiminas() {
  try {
    await poolConnect;
    const result = await pool.request().query('SELECT iki_id FROM ikimina_info');
    return result.recordset.map(row => row.iki_id);
  } catch (err) {
    console.error('Error fetching ikimina IDs:', err);
    return [];
  }
}

async function fetchRounds(iki_id) {
  try {
    const res = await fetch(`${BACKEND_URL}/selectRounds`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'x-iki-id': iki_id.toString(),
      },
    });
    if (!res.ok) {
      console.error(`Failed to fetch rounds for iki_id ${iki_id}: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!data.success) {
      console.error(`Failed to fetch rounds for iki_id ${iki_id}: ${data.message}`);
      return [];
    }
    return data.data;
  } catch (err) {
    console.error(`Error fetching rounds for iki_id ${iki_id}:`, err);
    return [];
  }
}

async function sendRoundStatusNotifications(iki_id, status, startDate = null) {
  try {
    await poolConnect;
    const members = await pool.request()
      .input('iki_id', iki_id)
      .query(`SELECT member_names, member_phone_number, member_email FROM members_info WHERE iki_id = @iki_id`);

    let smsMessage = '';
    let emailSubject = '';
    let emailBody = '';

    function formatDate(date) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(date).toLocaleDateString('en-US', options);
    }

    if (status === 'active') {
      smsMessage = 'Your Ikimina round is now active. Start saving today!';
      emailSubject = 'Ikimina Round Active Notification';
      emailBody = `<p>Dear member,</p><p>Your Ikimina round is now <strong>active</strong>. You can start saving today.</p><p>Best regards,<br>Ikimina Management System</p>`;
    } else if (status === 'upcoming') {
      const formattedStart = startDate ? formatDate(startDate) : 'soon';
      smsMessage = `Your Ikimina round is upcoming and will start on ${formattedStart}. Get ready to save!`;
      emailSubject = 'Ikimina Round Upcoming Notification';
      emailBody = `<p>Dear member,</p><p>Your Ikimina round is <strong>upcoming</strong> and will start on <strong>${formattedStart}</strong>. Please get ready to start saving soon.</p><p>Best regards,<br>Ikimina Management System</p>`;
    } else if (status === 'completed') {
      smsMessage = 'Your Ikimina round has been completed. Thank you for your participation!';
      emailSubject = 'Ikimina Round Completed Notification';
      emailBody = `<p>Dear member,</p><p>Your Ikimina round has been <strong>completed</strong>. Thank you for your participation.</p><p>Best regards,<br>Ikimina Management System</p>`;
    } else if (status === 'no_rounds') {
      smsMessage = 'There is currently no active or upcoming Ikimina round. Members are inactive by default.';
      emailSubject = 'Ikimina No Active Round Notification';
      emailBody = `<p>Dear member,</p><p>There is currently no active or upcoming Ikimina round. Member status is set to <strong>inactive</strong> by default.</p><p>Best regards,<br>Ikimina Management System</p>`;
    } else {
      return; // unknown status, no notification
    }

    for (const member of members.recordset) {
      if (member.member_phone_number) {
        try {
          await sendCustomSms(member.member_phone_number, `Hello ${member.member_names}, ${smsMessage}`);
        } catch (smsErr) {
          console.error(`Failed to send SMS to ${member.member_phone_number}:`, smsErr);
        }
      }
      if (member.member_email) {
        try {
          await sendCustomEmail(member.member_email, emailSubject, emailBody.replace('member', member.member_names));
        } catch (emailErr) {
          console.error(`Failed to send email to ${member.member_email}:`, emailErr);
        }
      }
    }


  } catch (err) {
    console.error('Error sending round status notifications:', err);
  }
}

async function waitingMembers(iki_id) {
  try {
    await pool.request()
      .input('iki_id', iki_id)
      .query(`UPDATE members_info SET m_status = 'waiting' WHERE iki_id = @iki_id`);
    
  } catch (err) {
    console.error(`Error setting members to waiting for ikimina ${iki_id}:`, err);
  }
}

async function activateMembers(iki_id) {
  try {
    await pool.request()
      .input('iki_id', iki_id)
      .query(`UPDATE members_info SET m_status = 'active' WHERE iki_id = @iki_id AND m_status != 'active'`);
   
  } catch (err) {
    console.error(`Error activating members for ikimina ${iki_id}:`, err);
  }
}

async function completeMembers(iki_id) {
  try {
    await pool.request()
      .input('iki_id', iki_id)
      .query(`UPDATE members_info SET m_status = 'inactive' WHERE iki_id = @iki_id AND m_status != 'inactive'`);
   
  } catch (err) {
    console.error(`Error updating members for ikimina ${iki_id} completion:`, err);
  }
}

async function updateSlotStatusesForIkimina(iki_id) {
  try {
    await poolConnect;

    // Get "today" at Kigali start of day
    const today = dayjs().tz(KIGALI_TZ).startOf('day');

    // Get all active or upcoming rounds, sorted by start_date
    const roundsResult = await pool.request()
      .input('iki_id', sql.Int, iki_id)
      .query(`
        SELECT round_id, start_date, end_date, round_status
        FROM ikimina_rounds
        WHERE iki_id = @iki_id AND round_status IN ('active', 'upcoming', 'future')
        ORDER BY start_date ASC
      `);

    if (roundsResult.recordset.length === 0) return;

    // Get location_id and frequency type
    const groupResult = await pool.request()
      .input('iki_id', sql.Int, iki_id)
      .query(`
        SELECT i.location_id, f.f_category
        FROM ikimina_info i
        JOIN frequency_category_info f ON i.f_id = f.f_id
        WHERE i.iki_id = @iki_id
      `);

    if (groupResult.recordset.length === 0) return;

    const { location_id, f_category } = groupResult.recordset[0];
    const freq = f_category.toLowerCase();

    // Determine custom weekly start day (like Tuesday)
    let customWeekDayIndex = 0; // Sunday default
    if (freq === 'weekly') {
      const weeklyRes = await pool.request()
        .input('location_id', sql.Int, location_id)
        .query(`SELECT TOP 1 weeklytime_day FROM ik_weekly_time_info WHERE location_id = @location_id`);
      if (weeklyRes.recordset.length > 0) {
        const dayName = weeklyRes.recordset[0].weeklytime_day.toLowerCase();
        const map = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
        if (map[dayName] !== undefined) customWeekDayIndex = map[dayName];
      }
    }

    // Determine custom monthly start date (like 5th or 10th)
    let customMonthStartDay = 1; // 1st default
    if (freq === 'monthly') {
      const monthlyRes = await pool.request()
        .input('location_id', sql.Int, location_id)
        .query(`SELECT TOP 1 monthlytime_date FROM ik_monthly_time_info WHERE location_id = @location_id`);
      if (monthlyRes.recordset.length > 0) {
        customMonthStartDay = parseInt(monthlyRes.recordset[0].monthlytime_date || '1');
      }
    }

    for (const round of roundsResult.recordset) {
      const roundStart = dayjs(round.start_date).tz(KIGALI_TZ).startOf('day');
      const roundEnd = dayjs(round.end_date).tz(KIGALI_TZ).startOf('day');
      const roundStatus = round.round_status.toLowerCase();

      // Fetch all slots for this round
      const slotsRes = await pool.request()
        .input('iki_id', sql.Int, iki_id)
        .input('round_id', sql.Int, round.round_id)
        .query(`SELECT slot_id, slot_date, slot_status FROM ikimina_saving_slots WHERE iki_id = @iki_id AND round_id = @round_id`);

      for (const slot of slotsRes.recordset) {
        // Parse slot_date with timezone, only date part matters
        const slotDate = dayjs(slot.slot_date).tz(KIGALI_TZ).startOf('day');
        let newStatus = 'upcoming'; // default fallback

        if (roundStatus === 'upcoming') {
          // Upcoming round: slots before today = passed, others upcoming
          newStatus = slotDate.isBefore(today) ? 'passed' : 'upcoming';

        } else if (roundStatus === 'active') {
          // Active round: set status based on frequency and slot date

          if (freq === 'daily') {
            if (slotDate.isBefore(today)) newStatus = 'passed';
            else if (slotDate.isSame(today)) newStatus = 'pending';
            else newStatus = 'upcoming';  // future slot

          } else if (freq === 'weekly') {
            const startOfWeek = today.day(customWeekDayIndex).startOf('day');
            const endOfWeek = startOfWeek.add(6, 'day').endOf('day');

            if (slotDate.isBefore(startOfWeek)) newStatus = 'passed';
            else if (slotDate.isBetween(startOfWeek, endOfWeek, null, '[]')) newStatus = 'pending';
            else newStatus = 'upcoming';

          } else if (freq === 'monthly') {
            const monthStart = dayjs(`${today.year()}-${String(today.month() + 1).padStart(2, '0')}-${String(customMonthStartDay).padStart(2, '0')}`).tz(KIGALI_TZ).startOf('day');
            const nextMonthEnd = monthStart.add(1, 'month').subtract(1, 'day').endOf('day');

            if (slotDate.isBefore(monthStart)) newStatus = 'passed';
            else if (slotDate.isBetween(monthStart, nextMonthEnd, null, '[]')) newStatus = 'pending';
            else newStatus = 'upcoming';
          }
        }

        // Update only if status changed
        if (slot.slot_status !== newStatus) {
          await pool.request()
            .input('slot_id', sql.Int, slot.slot_id)
            .input('slot_status', sql.VarChar, newStatus)
            .query(`UPDATE ikimina_saving_slots SET slot_status = @slot_status WHERE slot_id = @slot_id`);
        }
      }
    }
  } catch (err) {
    console.error(`Slot status update failed for Ikimina ${iki_id}:`, err);
  }
}


async function processRoundsForIkimina(iki_id) {
  const rounds = await fetchRounds(iki_id);

  if (!rounds.length) {
    // No rounds, all members should be inactive and notified only if last notified status differs
    const prevStatus = lastNotifiedStatus[`no_rounds_${iki_id}`];
    if (prevStatus !== 'no_rounds') {
      await pool.request()
        .input('iki_id', iki_id)
        .query(`UPDATE members_info SET m_status = 'inactive' WHERE iki_id = @iki_id`);
      await sendRoundStatusNotifications(iki_id, 'no_rounds');
      lastNotifiedStatus[`no_rounds_${iki_id}`] = 'no_rounds';
    }
    return;
  }

  const now = getKigaliToday();

  for (const round of rounds) {
    const startDate = startOfDay(utcToKigali(new Date(round.start_date)));
    const endDate = startOfDay(utcToKigali(new Date(round.end_date)));
    const currentStatus = round.round_status.toLowerCase();

    const lastStatus = lastNotifiedStatus[round.round_id];

    if (currentStatus === 'upcoming' && now >= startDate) {
      // Change to active
      const updated = await updateRoundStatus(iki_id, round.round_id, 'active');
      if (updated && lastStatus !== 'active') {
        await sendRoundStatusNotifications(iki_id, 'active');
        await activateMembers(iki_id);
        lastNotifiedStatus[round.round_id] = 'active';
      }
    } else if (currentStatus === 'active' && now > endDate) {
      // Change to completed
      const updated = await updateRoundStatus(iki_id, round.round_id, 'completed');
      if (updated && lastStatus !== 'completed') {
        await sendRoundStatusNotifications(iki_id, 'completed');
        await completeMembers(iki_id);
        lastNotifiedStatus[round.round_id] = 'completed';
      }
    } else if (currentStatus === 'upcoming') {
      // Notify upcoming and set members to waiting only if not notified before
      if (lastStatus !== 'upcoming') {
        await sendRoundStatusNotifications(iki_id, 'upcoming', startDate);
        await waitingMembers(iki_id);
        lastNotifiedStatus[round.round_id] = 'upcoming';
      }
    }
    // completed rounds remain as is - no notification on every check
  }
}

async function updateRoundStatus(iki_id, round_id, newStatus) {
  try {
    const res = await fetch(`${BACKEND_URL}/updateRoundStatus/${round_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'x-iki-id': iki_id.toString(),
      },
      body: JSON.stringify({ round_status: newStatus }),
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error(`Failed to update round ${round_id} status:`, errData.message || `HTTP ${res.status}`);
      return false;
    }

  
    return true;

  } catch (err) {
    console.error(`Error updating round status for round ${round_id}:`, err);
    return false;
  }
}

async function scheduler() {
  try {
    const ikiminas = await getAllIkiminas();
    if (!ikiminas.length) {
      console.warn('No ikiminas found to process.');
      return;
    }
    for (const iki_id of ikiminas) {
      await processRoundsForIkimina(iki_id);
      await updateSlotStatusesForIkimina(iki_id);
    }
  } catch (err) {
    console.error('Scheduler error:', err);
  }
}

console.log('Round Status Scheduler started. Checking every 60 seconds.');
scheduler();

setInterval(() => {
  scheduler();
}, CHECK_INTERVAL);
