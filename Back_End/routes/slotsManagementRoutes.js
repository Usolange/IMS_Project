const express = require('express');
const router = express.Router();
const db = require('../config/db');
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

// GET all slots for an Ikimina group
router.get('/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    const [slots] = await db.query(
      `SELECT s.slot_id, s.slot_date, s.slot_time, s.slot_status, f.f_category AS frequency_category
       FROM ikimina_saving_slots s
       JOIN frequency_category_info f ON s.frequency_category = f.f_category
       WHERE s.iki_id = ?
       ORDER BY s.slot_date, s.slot_time`,
      [iki_id]
    );
    res.json(slots);
  } catch (err) {
    console.error('GET slots error:', err);
    res.status(500).json({ message: 'Failed to fetch slots' });
  }
});

// GET saving cycle metadata for an Ikimina group
router.get('/metadata/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    const [cycleRows] = await db.query(
      `SELECT cycle_id, cycle_start, cycle_end, is_cycle_active 
       FROM saving_cycles 
       WHERE iki_id = ? 
       ORDER BY cycle_id DESC LIMIT 1`,
      [iki_id]
    );

    if (cycleRows.length === 0) {
      return res.json({ message: 'No saving cycle found', cycle: null });
    }

    const cycle = cycleRows[0];

    const [slotCountRows] = await db.query(
      `SELECT COUNT(*) AS total_slots FROM ikimina_saving_slots 
       WHERE iki_id = ? AND slot_date BETWEEN ? AND ?`,
      [
        iki_id,
        dayjs(cycle.cycle_start).format('YYYY-MM-DD'),
        dayjs(cycle.cycle_end).format('YYYY-MM-DD'),
      ]
    );

    res.json({
      cycle_start: cycle.cycle_start,
      cycle_end: cycle.cycle_end,
      is_cycle_active: cycle.is_cycle_active === 1,
      total_slots: slotCountRows[0].total_slots,
    });
  } catch (err) {
    console.error('GET cycle metadata error:', err);
    res.status(500).json({ message: 'Failed to fetch cycle metadata' });
  }
});

// POST generate all saving slots for a group
router.post('/generate/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  try {
    const [activeCycle] = await db.query(
      'SELECT * FROM saving_cycles WHERE iki_id = ? AND is_cycle_active = 1',
      [iki_id]
    );
    if (activeCycle.length > 0) {
      return res.status(400).json({ message: 'An active saving cycle already exists.' });
    }

    const [ikiminaRows] = await db.query(
      'SELECT iki_location AS location_id, f_id FROM ikimina_info WHERE iki_id = ?',
      [iki_id]
    );
    if (ikiminaRows.length === 0) return res.status(404).json({ message: 'Ikimina not found' });

    const { location_id, f_id } = ikiminaRows[0];

    const [category] = await db.query('SELECT f_category FROM frequency_category_info WHERE f_id = ?', [f_id]);
    if (category.length === 0) return res.status(404).json({ message: 'Frequency category not found' });

    const frequencyType = category[0].f_category.toLowerCase();

    const today = dayjs();
    const cycleEnd = today.add(1, 'year');
    const slots = [];

    if (frequencyType === 'daily') {
      const [times] = await db.query('SELECT dtime_time FROM ik_daily_time_info WHERE location_id = ?', [location_id]);

      let current = today;
      while (current.isSameOrBefore(cycleEnd)) {
        times.forEach(t => {
          slots.push([iki_id, current.format('YYYY-MM-DD'), t.dtime_time, 'Daily']);
        });
        current = current.add(1, 'day');
      }

    } else if (frequencyType === 'weekly') {
      const [entries] = await db.query('SELECT weeklytime_day, weeklytime_time FROM ik_weekly_time_info WHERE location_id = ?', [location_id]);

      let current = today;
      while (current.isSameOrBefore(cycleEnd)) {
        entries.forEach(e => {
          const targetDay = dayMap[e.weeklytime_day.toLowerCase()];
          if (typeof targetDay !== 'number') return;

          let targetDate = current.day(targetDay);
          if (targetDate.isBefore(current, 'day')) {
            targetDate = targetDate.add(1, 'week');
          }

          if (targetDate.isSameOrBefore(cycleEnd)) {
            slots.push([iki_id, targetDate.format('YYYY-MM-DD'), e.weeklytime_time, 'Weekly']);
          }
        });
        current = current.add(1, 'week');
      }

    } else if (frequencyType === 'monthly') {
      const [entries] = await db.query('SELECT monthlytime_date, monthlytime_time FROM ik_monthly_time_info WHERE location_id = ?', [location_id]);

      let current = today;
      while (current.isSameOrBefore(cycleEnd)) {
        entries.forEach(e => {
          const day = parseInt(e.monthlytime_date);
          const targetDate = current.date(day);
          if (
            targetDate.isValid() &&
            (targetDate.isSame(current, 'day') || targetDate.isAfter(current, 'day')) &&
            targetDate.isSameOrBefore(cycleEnd)
          ) {
            slots.push([iki_id, targetDate.format('YYYY-MM-DD'), e.monthlytime_time, 'Monthly']);
          }
        });
        current = current.add(1, 'month');
      }

    } else {
      return res.status(400).json({ message: 'Unknown frequency category.' });
    }

    if (slots.length === 0) return res.status(400).json({ message: 'No valid slots generated' });

    await db.query(
      `INSERT IGNORE INTO ikimina_saving_slots (iki_id, slot_date, slot_time, frequency_category) VALUES ?`,
      [slots]
    );

    const startDate = slots[0][1];
    const endDate = slots[slots.length - 1][1];

    await db.query(
      `INSERT INTO saving_cycles (iki_id, cycle_start, cycle_end, is_cycle_active) VALUES (?, ?, ?, 1)`,
      [iki_id, startDate, endDate]
    );

    res.json({ success: true, slotsGenerated: slots.length });

  } catch (err) {
    console.error('POST generate slots error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate saving slots' });
  }
});

// PUT reset slots & saving cycle (only if cycle ended)
router.put('/reset/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  try {
    const [[activeCycle]] = await db.query(
      'SELECT * FROM saving_cycles WHERE iki_id = ? AND is_cycle_active = 1 ORDER BY cycle_id DESC LIMIT 1',
      [iki_id]
    );

    if (!activeCycle) {
      return res.status(400).json({ message: 'No active saving cycle to reset.' });
    }

    const today = dayjs();
    const cycleEnd = dayjs(activeCycle.cycle_end);
    if (today.isBefore(cycleEnd)) {
      return res.status(403).json({ message: 'Cannot reset. Saving cycle is still active.' });
    }

    await db.query('UPDATE saving_cycles SET is_cycle_active = 0 WHERE cycle_id = ?', [activeCycle.cycle_id]);
    await db.query('DELETE FROM ikimina_saving_slots WHERE iki_id = ?', [iki_id]);

    res.json({ message: 'Saving cycle reset successfully.' });

  } catch (err) {
    console.error('PUT reset slots error:', err);
    res.status(500).json({ message: 'Failed to reset saving cycle' });
  }
});

module.exports = router;
