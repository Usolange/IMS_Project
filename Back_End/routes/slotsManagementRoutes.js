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
        f.f_category AS frequency_category
      FROM ikimina_saving_slots s
      JOIN frequency_category_info f ON s.frequency_category = f.f_category
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
    // 1. Try to get the active round first
    let roundQuery = `
      SELECT TOP 1 * FROM ikimina_rounds
      WHERE iki_id = @iki_id AND round_status = 'active'
      ORDER BY start_date ASC
    `;
    let rounds = await runQuery(roundQuery, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
    let round = rounds[0];

    // 2. If no active round, try upcoming round
    if (!round) {
      roundQuery = `
        SELECT TOP 1 * FROM ikimina_rounds
        WHERE iki_id = @iki_id AND round_status = 'upcoming'
        ORDER BY start_date ASC
      `;
      rounds = await runQuery(roundQuery, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
      round = rounds[0];
    }

    // 3. If no round at all
    if (!round) {
      return res.status(404).json({ message: 'No active or upcoming round found' });
    }

    // 4. Count how many slots are linked to this round
    const slotsQuery = `
      SELECT COUNT(*) AS total_slots
      FROM ikimina_saving_slots
      WHERE round_id = @round_id
    `;
    const slotCountRows = await runQuery(slotsQuery, [
      { name: 'round_id', type: sql.Int, value: round.round_id }
    ]);
    const total_slots = slotCountRows[0]?.total_slots || 0;

    // 5. Return round metadata
    res.json({
      round_id: round.round_id,
      start_date: round.start_date,
      end_date: round.end_date,
      round_status: round.round_status, // e.g., 'active', 'upcoming', 'closed'
      total_slots
    });
  } catch (err) {
    console.error('GET round metadata error:', err);
    res.status(500).json({ message: 'Failed to fetch round metadata' });
  }
});
router.get('/customTimeConfig/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    const pool = await db.poolConnect;
    const request = db.pool.request();

    // Fetch location_id
    const group = await request
      .input('iki_id', db.sql.Int, iki_id)
      .query(`SELECT location_id FROM ikimina_info WHERE iki_id = @iki_id`);

    if (group.recordset.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found' });
    }

    const location_id = group.recordset[0].location_id;

    // Weekly config
    const weeklyResult = await request
      .input('location_id', db.sql.Int, location_id)
      .query(`SELECT TOP 1 weeklytime_day FROM ik_weekly_time_info WHERE location_id = @location_id`);

    const map = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const weeklyDayIndex = weeklyResult.recordset.length > 0
      ? map[weeklyResult.recordset[0].weeklytime_day.toLowerCase()] ?? 0
      : 0;

    // Monthly config
    const monthlyResult = await request
      .input('location_id', db.sql.Int, location_id)
      .query(`SELECT TOP 1 monthlytime_date FROM ik_monthly_time_info WHERE location_id = @location_id`);

    const monthlyStartDay = monthlyResult.recordset.length > 0
      ? parseInt(monthlyResult.recordset[0].monthlytime_date) || 1
      : 1;

    return res.json({ weeklyDayIndex, monthlyStartDay });
  } catch (err) {
    console.error('Error fetching custom time config:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});
// PUT /reset/:iki_id
router.put('/reset/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  try {
    // 1. Get the latest round (any status)
    let roundQuery = `
      SELECT TOP 1 * FROM ikimina_rounds
      WHERE iki_id = @iki_id
      ORDER BY start_date DESC
    `;
    const rounds = await runQuery(roundQuery, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
    const round = rounds[0];

    if (!round) {
      return res.status(404).json({ message: 'No round found to reset slots for.' });
    }

    // 2. Prevent reset if round is active or completed
    if (round.round_status === 'active' || round.round_status === 'completed' || round.round_status === 'closed') {
      return res.status(400).json({ message: `Cannot reset slots: round status is '${round.round_status}'.` });
    }

    // 3. If round is not active or completed, delete all slots linked to this round
    const deleteQuery = `
      DELETE FROM ikimina_saving_slots WHERE round_id = @round_id
    `;
    await runQuery(deleteQuery, [{ name: 'round_id', type: sql.Int, value: round.round_id }]);

    res.json({ message: 'Slots cleared successfully for this round.' });
  } catch (err) {
    console.error('PUT reset slots error:', err);
    res.status(500).json({ message: 'Failed to reset slots' });
  }
});


const formatTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().substr(11, 8); // "HH:mm:ss"
};

// POST generate all saving slots for a group
router.post('/newSlots/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  try {
    // 1. Find active round
    let roundQuery = `
      SELECT TOP 1 * FROM ikimina_rounds
      WHERE iki_id = @iki_id AND round_status = 'active'
      ORDER BY start_date ASC
    `;
    let rounds = await runQuery(roundQuery, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
    let round = rounds[0];

    // 2. If no active, use nearest upcoming round
    if (!round) {
      roundQuery = `
        SELECT TOP 1 * FROM ikimina_rounds
        WHERE iki_id = @iki_id AND round_status = 'upcoming'
        ORDER BY start_date ASC
      `;
      rounds = await runQuery(roundQuery, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
      round = rounds[0];
      if (!round) {
        return res.status(400).json({ message: 'No active or upcoming rounds found for this Ikimina.' });
      }
    }

    // 3. Check if slots already exist
    const slotCheckQuery = `
      SELECT TOP 1 1 FROM ikimina_saving_slots WHERE round_id = @round_id
    `;
    const existingSlots = await runQuery(slotCheckQuery, [{ name: 'round_id', type: sql.Int, value: round.round_id }]);
    if (existingSlots.length > 0) {
      return res.status(400).json({ message: 'Slots already generated for this round.' });
    }

    // 4. Get Ikimina location and frequency info
    const ikiminaQuery = `
      SELECT location_id, f_id FROM ikimina_info WHERE iki_id = @iki_id
    `;
    const ikiminaRows = await runQuery(ikiminaQuery, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
    if (ikiminaRows.length === 0) return res.status(404).json({ message: 'Ikimina not found' });

    const { location_id, f_id } = ikiminaRows[0];

    const categoryQuery = `
      SELECT f_category FROM frequency_category_info WHERE f_id = @f_id
    `;
    const categoryRows = await runQuery(categoryQuery, [{ name: 'f_id', type: sql.Int, value: f_id }]);
    if (categoryRows.length === 0) return res.status(404).json({ message: 'Frequency category not found' });

    const frequencyType = categoryRows[0].f_category.toLowerCase();
    const startDate = dayjs(round.start_date);
    const endDate = dayjs(round.end_date);
    const slots = [];

    // 5. Generate slots
    if (frequencyType === 'daily') {
      const timesQuery = `SELECT dtime_time FROM ik_daily_time_info WHERE location_id = @location_id`;
      const times = await runQuery(timesQuery, [{ name: 'location_id', type: sql.Int, value: location_id }]);
      let current = startDate;
      while (current.isSameOrBefore(endDate)) {
        times.forEach(t => {
          const timeStr = formatTime(t.dtime_time);
          if (!timeStr) {
            console.warn('Skipping invalid daily time:', t.dtime_time);
            return;
          }
          slots.push([iki_id, current.format('YYYY-MM-DD'), timeStr, 'Daily', round.round_id]);
        });
        current = current.add(1, 'day');
      }

    } else if (frequencyType === 'weekly') {
      const entriesQuery = `SELECT weeklytime_day, weeklytime_time FROM ik_weekly_time_info WHERE location_id = @location_id`;
      const entries = await runQuery(entriesQuery, [{ name: 'location_id', type: sql.Int, value: location_id }]);
      let current = startDate;
      while (current.isSameOrBefore(endDate)) {
        entries.forEach(e => {
          const targetDay = dayMap[e.weeklytime_day.toLowerCase()];
          const timeStr = formatTime(e.weeklytime_time);
          if (typeof targetDay !== 'number' || !timeStr) {
            console.warn('Skipping invalid weekly entry:', e);
            return;
          }
          let targetDate = current.day(targetDay);
          if (targetDate.isBefore(current, 'day')) targetDate = targetDate.add(1, 'week');
          if (targetDate.isSameOrBefore(endDate)) {
            slots.push([iki_id, targetDate.format('YYYY-MM-DD'), timeStr, 'Weekly', round.round_id]);
          }
        });
        current = current.add(1, 'week');
      }

    } else if (frequencyType === 'monthly') {
      const entriesQuery = `SELECT monthlytime_date, monthlytime_time FROM ik_monthly_time_info WHERE location_id = @location_id`;
      const entries = await runQuery(entriesQuery, [{ name: 'location_id', type: sql.Int, value: location_id }]);
      let current = startDate;
      while (current.isSameOrBefore(endDate)) {
        entries.forEach(e => {
          const timeStr = formatTime(e.monthlytime_time);
          const day = parseInt(e.monthlytime_date);
          const targetDate = current.date(day);
          if (!timeStr || !targetDate.isValid() || !targetDate.isSameOrBefore(endDate)) {
            console.warn('Skipping invalid monthly entry:', e);
            return;
          }
          slots.push([iki_id, targetDate.format('YYYY-MM-DD'), timeStr, 'Monthly', round.round_id]);
        });
        current = current.add(1, 'month');
      }

    } else {
      return res.status(400).json({ message: 'Unknown frequency category.' });
    }

    if (slots.length === 0) return res.status(400).json({ message: 'No valid slots generated' });

    // 6. Bulk insert into DB inside transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const request = new sql.Request(transaction);
      for (const [iki, date, time, category, roundId] of slots) {
        request.input('iki_id', sql.Int, iki);
        request.input('slot_date', sql.Date, date);
        request.input('slot_time', sql.VarChar, time);
        request.input('frequency_category', sql.VarChar, category);
        request.input('round_id', sql.Int, roundId);
        await request.query(`
          INSERT INTO ikimina_saving_slots (iki_id, slot_date, slot_time, frequency_category, round_id)
          VALUES (@iki_id, @slot_date, @slot_time, @frequency_category, @round_id)
        `);
        request.parameters = {}; // clear inputs for next insert
      }
      await transaction.commit();
      res.json({ success: true, slotsGenerated: slots.length, roundId: round.round_id });
    } catch (err) {
      await transaction.rollback();
      console.error('Error inserting slots:', err);
      res.status(500).json({ success: false, message: 'Failed to generate saving slots' });
    }

  } catch (err) {
    console.error('POST generate slots error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate saving slots' });
  }
});

module.exports = router;