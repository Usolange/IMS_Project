// const express = require('express');
// const router = express.Router();
// const { pool, sql, poolConnect } = require('../config/db');
// const dayjs = require('dayjs');
// const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
// dayjs.extend(isSameOrBefore);

// const dayMap = {
//   sunday: 0,
//   monday: 1,
//   tuesday: 2,
//   wednesday: 3,
//   thursday: 4,
//   friday: 5,
//   saturday: 6,
// };

// async function runQuery(query, params = []) {
//   await poolConnect;
//   const request = pool.request();
//   params.forEach(({ name, type, value }) => request.input(name, type, value));
//   const result = await request.query(query);
//   return result.recordset;
// }
// function formatTimeToHHMMSS(timeString) {
//   if (!timeString || typeof timeString !== 'string') return null;

//   let parts = timeString.split(':');

//   let hours = parts[0].padStart(2, '0');
//   let minutes = parts[1] ? parts[1].padStart(2, '0') : '00';
//   let seconds = parts[2] ? parts[2].padStart(2, '0') : '00';

//   return `${hours}:${minutes}:${seconds}`;
// }


// // GET all slots for an Ikimina group
// router.get('/selectAllSlots/:iki_id', async (req, res) => {
//   const { iki_id } = req.params;
//   try {
//     const query = `
//       SELECT 
//         s.slot_id, 
//         FORMAT(s.slot_date, 'yyyy-MM-dd') AS slot_date, 
//         CONVERT(varchar(8), s.slot_time, 108) AS slot_time, 
//         s.slot_status, 
//         s.round_id, 
//         f.f_category AS frequency_category
//       FROM ikimina_saving_slots s
//       JOIN frequency_category_info f ON s.frequency_category = f.f_category
//       WHERE s.iki_id = @iki_id
//       ORDER BY s.slot_date, s.slot_time
//     `;
//     const slots = await runQuery(query, [
//       { name: 'iki_id', type: sql.Int, value: iki_id }
//     ]);
//     res.json(slots);
//   } catch (err) {
//     console.error('GET slots error:', err);
//     res.status(500).json({ message: 'Failed to fetch slots' });
//   }
// });

// // GET round metadata for an Ikimina group
// router.get('/roundMetadata/:iki_id', async (req, res) => {
//   const { iki_id } = req.params;

//   try {
//     // 1. Try to get the active round first
//     let roundQuery = `
//       SELECT TOP 1 * FROM ikimina_rounds
//       WHERE iki_id = @iki_id AND round_status = 'active'
//       ORDER BY start_date ASC
//     `;
//     let rounds = await runQuery(roundQuery, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
//     let round = rounds[0];

//     // 2. If no active round, try upcoming round
//     if (!round) {
//       roundQuery = `
//         SELECT TOP 1 * FROM ikimina_rounds
//         WHERE iki_id = @iki_id AND round_status = 'upcoming'
//         ORDER BY start_date ASC
//       `;
//       rounds = await runQuery(roundQuery, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
//       round = rounds[0];
//     }

//     // 3. If no round at all
//     if (!round) {
//       return res.status(404).json({ message: 'No active or upcoming round found' });
//     }

//     // 4. Count how many slots are linked to this round
//     const slotsQuery = `
//       SELECT COUNT(*) AS total_slots
//       FROM ikimina_saving_slots
//       WHERE round_id = @round_id
//     `;
//     const slotCountRows = await runQuery(slotsQuery, [
//       { name: 'round_id', type: sql.Int, value: round.round_id }
//     ]);
//     const total_slots = slotCountRows[0]?.total_slots || 0;

//     // 5. Return round metadata
//     res.json({
//       round_id: round.round_id,
//       start_date: round.start_date,
//       end_date: round.end_date,
//       round_status: round.round_status, // e.g., 'active', 'upcoming', 'closed'
//       total_slots
//     });
//   } catch (err) {
//     console.error('GET round metadata error:', err);
//     res.status(500).json({ message: 'Failed to fetch round metadata' });
//   }
// });

// router.get('/customTimeConfig/:iki_id', async (req, res) => {
//   const { iki_id } = req.params;
//   try {
//     const pool = await poolConnect;
//     const request = pool.request();

//     // Fetch location_id
//     const group = await request
//       .input('iki_id', sql.Int, iki_id)
//       .query(`SELECT location_id FROM ikimina_info WHERE iki_id = @iki_id`);

//     if (group.recordset.length === 0) {
//       return res.status(404).json({ message: 'Ikimina not found' });
//     }

//     const location_id = group.recordset[0].location_id;

//     // Weekly config
//     const weeklyResult = await request
//       .input('location_id', sql.Int, location_id)
//       .query(`SELECT TOP 1 weeklytime_day FROM ik_weekly_time_info WHERE location_id = @location_id`);

//     const map = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
//     const weeklyDayIndex = weeklyResult.recordset.length > 0
//       ? map[weeklyResult.recordset[0].weeklytime_day.toLowerCase()] ?? 0
//       : 0;

//     // Monthly config
//     const monthlyResult = await request
//       .input('location_id', sql.Int, location_id)
//       .query(`SELECT TOP 1 monthlytime_date FROM ik_monthly_time_info WHERE location_id = @location_id`);

//     const monthlyStartDay = monthlyResult.recordset.length > 0
//       ? parseInt(monthlyResult.recordset[0].monthlytime_date) || 1
//       : 1;

//     return res.json({ weeklyDayIndex, monthlyStartDay });
//   } catch (err) {
//     console.error('Error fetching custom time config:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // PUT /reset/:iki_id
// router.put('/reset/:iki_id', async (req, res) => {
//   const { iki_id } = req.params;

//   try {
//     // 1. Get the latest round (any status)
//     let roundQuery = `
//       SELECT TOP 1 * FROM ikimina_rounds
//       WHERE iki_id = @iki_id
//       ORDER BY start_date DESC
//     `;
//     const rounds = await runQuery(roundQuery, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
//     const round = rounds[0];

//     if (!round) {
//       return res.status(404).json({ message: 'No round found to reset slots for.' });
//     }

//     // 2. Prevent reset if round is active or completed or closed
//     if (['active', 'completed', 'closed'].includes(round.round_status)) {
//       return res.status(400).json({ message: `Cannot reset slots: round status is '${round.round_status}'.` });
//     }

//     // 3. If round is not active or completed, delete all slots linked to this round
//     const deleteQuery = `
//       DELETE FROM ikimina_saving_slots WHERE round_id = @round_id
//     `;
//     await runQuery(deleteQuery, [{ name: 'round_id', type: sql.Int, value: round.round_id }]);

//     res.json({ message: 'Slots cleared successfully for this round.' });
//   } catch (err) {
//     console.error('PUT reset slots error:', err);
//     res.status(500).json({ message: 'Failed to reset slots' });
//   }
// });

// router.post('/newSlots/:iki_id', async (req, res) => {
//   const { iki_id } = req.params;

//   try {
//     await pool.connect();

//     // 1. Find active round
//     let result = await pool.request()
//       .input('iki_id', sql.Int, iki_id)
//       .query(`
//         SELECT TOP 1 * FROM ikimina_rounds
//         WHERE iki_id = @iki_id AND round_status = 'active'
//         ORDER BY start_date ASC
//       `);

//     let round = result.recordset[0];

//     // 2. If no active round, find upcoming round
//     if (!round) {
//       result = await pool.request()
//         .input('iki_id', sql.Int, iki_id)
//         .query(`
//           SELECT TOP 1 * FROM ikimina_rounds
//           WHERE iki_id = @iki_id AND round_status = 'upcoming'
//           ORDER BY start_date ASC
//         `);
//       round = result.recordset[0];

//       if (!round) {
//         return res.status(400).json({ message: 'No active or upcoming rounds found for this Ikimina.' });
//       }
//     }

//     // 3. Check if slots already exist for this round
//     const existingSlotsResult = await pool.request()
//       .input('round_id', sql.Int, round.round_id)
//       .query(`SELECT TOP 1 1 FROM ikimina_saving_slots WHERE round_id = @round_id`);

//     if (existingSlotsResult.recordset.length > 0) {
//       return res.status(400).json({ message: 'Slots already generated for this round.' });
//     }

//     // 4. Get Ikimina location and frequency info
//     const ikiminaResult = await pool.request()
//       .input('iki_id', sql.Int, iki_id)
//       .query(`SELECT location_id, f_id FROM ikimina_info WHERE iki_id = @iki_id`);

//     if (ikiminaResult.recordset.length === 0) {
//       return res.status(404).json({ message: 'Ikimina not found' });
//     }

//     const { location_id, f_id } = ikiminaResult.recordset[0];

//     const categoryResult = await pool.request()
//       .input('f_id', sql.Int, f_id)
//       .query(`SELECT f_category FROM frequency_category_info WHERE f_id = @f_id`);

//     if (categoryResult.recordset.length === 0) {
//       return res.status(404).json({ message: 'Frequency category not found' });
//     }

//     const frequencyType = categoryResult.recordset[0].f_category.toLowerCase();
//     const startDate = dayjs(round.start_date);
//     const endDate = dayjs(round.end_date);
//     const slots = [];

//     // 5. Generate slots based on frequency
//     if (frequencyType === 'daily') {
//       // Get earliest daily time only
//       const timeResult = await pool.request()
//         .input('location_id', sql.Int, location_id)
//         .query(`SELECT MIN(dtime_time) as dtime_time FROM ik_daily_time_info WHERE location_id = @location_id`);

//       const timeStr = formatTimeToHHMMSS(timeResult.recordset[0]?.dtime_time);

//       let current = startDate;
//       while (current.isSameOrBefore(endDate)) {
//         if (timeStr) {
//           slots.push([iki_id, current.format('YYYY-MM-DD'), timeStr, 'Daily', round.round_id]);
//         }
//         current = current.add(1, 'day');
//       }

//     } else if (frequencyType === 'weekly') {
//       const entriesResult = await pool.request()
//         .input('location_id', sql.Int, location_id)
//         .query(`SELECT weeklytime_day, weeklytime_time FROM ik_weekly_time_info WHERE location_id = @location_id`);

//       const startDayNum = startDate.day();

//       entriesResult.recordset.forEach(entry => {
//         const targetDayNum = dayMap[entry.weeklytime_day.toLowerCase()];
//         if (targetDayNum === undefined) return;

//         let dayDiff = (targetDayNum - startDayNum + 7) % 7;
//         let firstDate = startDate.add(dayDiff, 'day');

//         for (let d = firstDate; d.isSameOrBefore(endDate); d = d.add(7, 'day')) {
//           const timeStr = formatTimeToHHMMSS(entry.weeklytime_time);
//           if (!timeStr) continue;
//           slots.push([iki_id, d.format('YYYY-MM-DD'), timeStr, 'Weekly', round.round_id]);
//         }
//       });

//     } else if (frequencyType === 'monthly') {
//       const entriesResult = await pool.request()
//         .input('location_id', sql.Int, location_id)
//         .query(`SELECT monthlytime_date, monthlytime_time FROM ik_monthly_time_info WHERE location_id = @location_id`);

//       entriesResult.recordset.forEach(entry => {
//         const dayNum = parseInt(entry.monthlytime_date);
//         if (isNaN(dayNum)) return;

//         let monthIter = startDate;

//         while (monthIter.isSameOrBefore(endDate, 'month')) {
//           let targetDate = monthIter.date(dayNum);
//           if (!targetDate.isValid()) {
//             monthIter = monthIter.add(1, 'month');
//             continue;
//           }
//           if (targetDate.isBefore(startDate, 'day')) {
//             monthIter = monthIter.add(1, 'month');
//             continue;
//           }
//           if (targetDate.isSameOrBefore(endDate, 'day')) {
//             const timeStr = formatTimeToHHMMSS(entry.monthlytime_time);
//             if (timeStr) {
//               slots.push([iki_id, targetDate.format('YYYY-MM-DD'), timeStr, 'Monthly', round.round_id]);
//             }
//           }
//           monthIter = monthIter.add(1, 'month');
//         }
//       });

//     } else {
//       return res.status(400).json({ message: 'Unknown frequency category.' });
//     }

//     if (slots.length === 0) {
//       return res.status(400).json({ message: 'No valid slots generated' });
//     }

//     // 6. Insert slots in batches inside a transaction
//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     try {
//       const BATCH_SIZE = 500;

//       for (let i = 0; i < slots.length; i += BATCH_SIZE) {
//         const batch = slots.slice(i, i + BATCH_SIZE);
//         let insertQuery = `INSERT INTO ikimina_saving_slots (iki_id, slot_date, slot_time, frequency_category, round_id) VALUES `;
//         const valueStrings = [];
//         const request = new sql.Request(transaction);

//         batch.forEach(([iki, date, time, category, roundId], idx) => {
//           const formattedTime = formatTimeToHHMMSS(time);
//           const timeParts = formattedTime.split(':');
//           const timeValue = new Date(1970, 0, 1, Number(timeParts[0]), Number(timeParts[1]), Number(timeParts[2]));

//           valueStrings.push(`(@iki_id${idx}, @slot_date${idx}, @slot_time${idx}, @freq_cat${idx}, @round_id${idx})`);

//           request.input(`iki_id${idx}`, sql.Int, iki);
//           request.input(`slot_date${idx}`, sql.Date, date);
//           request.input(`slot_time${idx}`, sql.Time, timeValue);
//           request.input(`freq_cat${idx}`, sql.VarChar(50), category);
//           request.input(`round_id${idx}`, sql.Int, roundId);
//         });

//         insertQuery += valueStrings.join(', ');

//         await request.query(insertQuery);
//       }

//       await transaction.commit();

//       res.json({ success: true, slotsGenerated: slots.length, roundId: round.round_id });
//     } catch (err) {
//       try {
//         await transaction.rollback();
//       } catch (rollbackErr) {
//         console.error('Rollback error:', rollbackErr);
//       }
//       console.error('Error inserting slots:', err);
//       return res.status(500).json({ success: false, message: 'Failed to generate saving slots', error: err.message });
//     }

//   } catch (err) {
//     console.error('POST generate slots error:', err);
//     return res.status(500).json({ success: false, message: 'Failed to generate saving slots', error: err.message });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');
const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
dayjs.extend(isSameOrBefore);

const dayMap = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

async function runQuery(query, params = []) {
  await poolConnect;
  const request = pool.request();
  params.forEach(({ name, type, value }) => request.input(name, type, value));
  const result = await request.query(query);
  return result.recordset;
}

function formatTimeToHHMMSS(timeString) {
  if (!timeString) return null;
  if (typeof timeString !== 'string') {
    // Try to convert to string if it's a Date or other
    if (timeString instanceof Date) {
      return timeString.toTimeString().slice(0, 8);
    }
    return null;
  }

  let parts = timeString.split(':');
  if (parts.length < 2) return null; // invalid format

  let hours = parts[0].padStart(2, '0');
  let minutes = parts[1].padStart(2, '0');
  let seconds = parts[2] ? parts[2].padStart(2, '0') : '00';

  return `${hours}:${minutes}:${seconds}`;
}

// GET all slots for an Ikimina group
router.get('/selectAllSlots/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    const query = `
      SELECT 
        s.slot_id, 
        FORMAT(s.slot_date, 'yyyy-MM-dd') AS slot_date, 
        CONVERT(varchar(8), s.slot_time, 108) AS slot_time, 
        s.slot_status, 
        s.round_id, 
        s.frequency_category
      FROM ikimina_saving_slots s
      WHERE s.iki_id = @iki_id
      ORDER BY s.slot_date, s.slot_time
    `;
    const slots = await runQuery(query, [
      { name: 'iki_id', type: sql.Int, value: iki_id }
    ]);
    res.json(slots);
  } catch (err) {
    console.error('GET slots error:', err);
    res.status(500).json({ message: 'Failed to fetch slots' });
  }
});

// GET round metadata for an Ikimina group
router.get('/roundMetadata/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  try {
    let roundQuery = `
      SELECT TOP 1 * FROM ikimina_rounds
      WHERE iki_id = @iki_id AND round_status = 'active'
      ORDER BY start_date ASC
    `;
    let rounds = await runQuery(roundQuery, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
    let round = rounds[0];

    if (!round) {
      roundQuery = `
        SELECT TOP 1 * FROM ikimina_rounds
        WHERE iki_id = @iki_id AND round_status = 'upcoming'
        ORDER BY start_date ASC
      `;
      rounds = await runQuery(roundQuery, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
      round = rounds[0];
    }

    if (!round) {
      return res.status(404).json({ message: 'No active or upcoming round found' });
    }

    const slotsQuery = `
      SELECT COUNT(*) AS total_slots
      FROM ikimina_saving_slots
      WHERE round_id = @round_id
    `;
    const slotCountRows = await runQuery(slotsQuery, [
      { name: 'round_id', type: sql.Int, value: round.round_id }
    ]);
    const total_slots = slotCountRows[0]?.total_slots || 0;

    res.json({
      round_id: round.round_id,
      start_date: round.start_date,
      end_date: round.end_date,
      round_status: round.round_status,
      total_slots
    });
  } catch (err) {
    console.error('GET round metadata error:', err);
    res.status(500).json({ message: 'Failed to fetch round metadata' });
  }
});



// PUT /reset/:iki_id to clear slots only if round is NOT active/completed/closed
router.put('/reset/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  try {
    // Get the latest round for this iki_id
    const roundQuery = `
      SELECT TOP 1 * FROM ikimina_rounds
      WHERE iki_id = @iki_id
      ORDER BY start_date DESC
    `;
    const rounds = await runQuery(roundQuery, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
    const round = rounds[0];

    if (!round) {
      return res.status(404).json({ message: 'No round found to reset slots for.' });
    }

    // Check if round status forbids resetting slots
    if (['active', 'completed', 'closed'].includes(round.round_status)) {
      return res.status(400).json({
        message: `Cannot reset slots: round status is '${round.round_status}'.`
      });
    }

    // Disable constraints temporarily to allow delete
    const disableConstraints = `
      EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL";
    `;
    await runQuery(disableConstraints);

    // Delete only slots for this round
    const deleteQuery = `
      DELETE FROM ikimina_saving_slots WHERE round_id = @round_id
    `;
    await runQuery(deleteQuery, [{ name: 'round_id', type: sql.Int, value: round.round_id }]);

    // Reset identity seed for ikimina_saving_slots
    const resetIdentity = `
      DBCC CHECKIDENT ('ikimina_saving_slots', RESEED, 0);
    `;
    await runQuery(resetIdentity);

    // Re-enable constraints after deletion
    const enableConstraints = `
      EXEC sp_msforeachtable "ALTER TABLE ? CHECK CONSTRAINT ALL";
    `;
    await runQuery(enableConstraints);

    res.json({ message: 'Slots cleared and identity reset successfully for this round.' });

  } catch (err) {
    console.error('PUT reset slots error:', err);
    res.status(500).json({ message: 'Failed to reset slots' });
  }
});

router.post('/newSlots/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  try {
    await pool.connect();

    // 1. Find active round
    let result = await pool.request()
      .input('iki_id', sql.Int, iki_id)
      .query(`
        SELECT TOP 1 * FROM ikimina_rounds
        WHERE iki_id = @iki_id AND round_status = 'active'
        ORDER BY start_date ASC
      `);

    let round = result.recordset[0];

    // 2. If no active round, find upcoming round
    if (!round) {
      result = await pool.request()
        .input('iki_id', sql.Int, iki_id)
        .query(`
          SELECT TOP 1 * FROM ikimina_rounds
          WHERE iki_id = @iki_id AND round_status = 'upcoming'
          ORDER BY start_date ASC
        `);
      round = result.recordset[0];

      if (!round) {
        return res.status(400).json({ message: 'No active or upcoming rounds found for this Ikimina.' });
      }
    }

    // 3. Check if slots already exist for this round
    const existingSlotsResult = await pool.request()
      .input('round_id', sql.Int, round.round_id)
      .query(`SELECT TOP 1 1 FROM ikimina_saving_slots WHERE round_id = @round_id`);

    if (existingSlotsResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Slots already generated for this round.' });
    }

    // 4. Get Ikimina location and frequency info
    const ikiminaResult = await pool.request()
      .input('iki_id', sql.Int, iki_id)
      .query(`SELECT location_id, f_id FROM ikimina_info WHERE iki_id = @iki_id`);

    if (ikiminaResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found' });
    }

    const { location_id, f_id } = ikiminaResult.recordset[0];

    const categoryResult = await pool.request()
      .input('f_id', sql.Int, f_id)
      .query(`SELECT f_category FROM frequency_category_info WHERE f_id = @f_id`);

    if (categoryResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Frequency category not found' });
    }

    const frequencyType = categoryResult.recordset[0].f_category.toLowerCase();
    const startDate = dayjs(round.start_date);
    const endDate = dayjs(round.end_date);
    const slots = [];

    console.log('Frequency Type:', frequencyType);
    console.log('Start Date:', startDate.format());
    console.log('End Date:', endDate.format());

    // 5. Generate slots based on frequency
    if (frequencyType === 'daily') {
      // Get earliest daily time only
      const timeResult = await pool.request()
        .input('location_id', sql.Int, location_id)
        .query(`SELECT MIN(dtime_time) as dtime_time FROM ik_daily_time_info WHERE location_id = @location_id`);

      const timeStr = formatTimeToHHMMSS(timeResult.recordset[0]?.dtime_time);
      console.log('Daily time:', timeStr);

      if (!timeStr) {
        return res.status(400).json({ message: 'No daily time configured' });
      }

      let current = startDate;
      while (current.isSameOrBefore(endDate)) {
        slots.push([iki_id, current.format('YYYY-MM-DD'), timeStr, 'Daily', round.round_id]);
        console.log('Adding daily slot:', current.format('YYYY-MM-DD'), timeStr);
        current = current.add(1, 'day');
      }

    } else if (frequencyType === 'weekly') {
      const entriesResult = await pool.request()
        .input('location_id', sql.Int, location_id)
        .query(`SELECT weeklytime_day, weeklytime_time FROM ik_weekly_time_info WHERE location_id = @location_id`);

      const startDayNum = startDate.day();

      entriesResult.recordset.forEach(entry => {
        const targetDayNum = dayMap[entry.weeklytime_day.toLowerCase()];
        if (targetDayNum === undefined) return;

        let dayDiff = (targetDayNum - startDayNum + 7) % 7;
        let firstDate = startDate.add(dayDiff, 'day');

        for (let d = firstDate; d.isSameOrBefore(endDate); d = d.add(7, 'day')) {
          const timeStr = formatTimeToHHMMSS(entry.weeklytime_time);
          if (!timeStr) return;
          slots.push([iki_id, d.format('YYYY-MM-DD'), timeStr, 'Weekly', round.round_id]);
          console.log('Adding weekly slot:', d.format('YYYY-MM-DD'), timeStr);
        }
      });

    } else if (frequencyType === 'monthly') {
      const entriesResult = await pool.request()
        .input('location_id', sql.Int, location_id)
        .query(`SELECT monthlytime_date, monthlytime_time FROM ik_monthly_time_info WHERE location_id = @location_id`);

      entriesResult.recordset.forEach(entry => {
        const dayNum = parseInt(entry.monthlytime_date);
        if (isNaN(dayNum)) return;

        let monthIter = startDate.startOf('month');

        while (monthIter.isSameOrBefore(endDate, 'month')) {
          if (dayNum > monthIter.daysInMonth()) {
            monthIter = monthIter.add(1, 'month');
            continue;
          }

          let targetDate = monthIter.date(dayNum);

          if (targetDate.isBefore(startDate, 'day')) {
            monthIter = monthIter.add(1, 'month');
            continue;
          }

          if (targetDate.isSameOrBefore(endDate, 'day')) {
            const timeStr = formatTimeToHHMMSS(entry.monthlytime_time);
            if (timeStr) {
              slots.push([iki_id, targetDate.format('YYYY-MM-DD'), timeStr, 'Monthly', round.round_id]);
              console.log('Adding monthly slot:', targetDate.format('YYYY-MM-DD'), timeStr);
            }
          }
          monthIter = monthIter.add(1, 'month');
        }
      });

    } else {
      return res.status(400).json({ message: 'Unknown frequency category.' });
    }

    if (slots.length === 0) {
      return res.status(400).json({ message: 'No valid slots generated' });
    }

    // 6. Insert slots in batches inside a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const BATCH_SIZE = 500;

      for (let i = 0; i < slots.length; i += BATCH_SIZE) {
        const batch = slots.slice(i, i + BATCH_SIZE);
        let insertQuery = `INSERT INTO ikimina_saving_slots (iki_id, slot_date, slot_time, frequency_category, round_id) VALUES `;
        const valueStrings = [];
        const request = new sql.Request(transaction);

        batch.forEach(([iki, date, time, category, roundId], idx) => {
          const formattedTime = formatTimeToHHMMSS(time);
          const timeParts = formattedTime.split(':');
          const timeValue = new Date(1970, 0, 1, Number(timeParts[0]), Number(timeParts[1]), Number(timeParts[2]));

          valueStrings.push(`(@iki_id${idx}, @slot_date${idx}, @slot_time${idx}, @freq_cat${idx}, @round_id${idx})`);

          request.input(`iki_id${idx}`, sql.Int, iki);
          request.input(`slot_date${idx}`, sql.Date, date);
          request.input(`slot_time${idx}`, sql.Time, timeValue);
          request.input(`freq_cat${idx}`, sql.VarChar(50), category);
          request.input(`round_id${idx}`, sql.Int, roundId);
        });

        insertQuery += valueStrings.join(', ');

        await request.query(insertQuery);
      }

      await transaction.commit();

      res.json({ success: true, slotsGenerated: slots.length, roundId: round.round_id });
    } catch (err) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error('Rollback error:', rollbackErr);
      }
      console.error('Error inserting slots:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate saving slots', error: err.message });
    }

  } catch (err) {
    console.error('POST generate slots error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate saving slots', error: err.message });
  }
});

module.exports = router;
