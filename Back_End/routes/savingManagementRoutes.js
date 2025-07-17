const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');
const moment = require('moment');

async function runQuery(query, params = []) {
  await poolConnect;
  const request = pool.request();
  params.forEach(({ name, type, value }) => {
    request.input(name, type, value);
  });
  const result = await request.query(query);
  return result.recordset;
}

// POST /save/:member_id/:slot_id
router.post('/save/:member_id/:slot_id', async (req, res) => {
  const { member_id, slot_id } = req.params;
  const { saved_amount } = req.body;

  try {
    // Get slot info
    const slotQuery = `
      SELECT s.*, i.saving_ratio, i.time_limit_minutes, i.time_delay_penalty, i.date_delay_penalty
      FROM ikimina_saving_slots s
      JOIN ikimina_info ik ON s.iki_id = ik.iki_id
      JOIN ikimina_saving_rules i ON i.iki_id = ik.iki_id
      WHERE s.slot_id = @slot_id
    `;

    const slotRows = await runQuery(slotQuery, [
      { name: 'slot_id', type: sql.Int, value: slot_id }
    ]);

    const slot = slotRows[0];
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    // Validate amount multiple
    if (saved_amount % slot.saving_ratio !== 0) {
      return res.status(400).json({ success: false, message: `Amount must be multiple of ${slot.saving_ratio}` });
    }

    const now = moment();
    const slotDateTime = moment(`${slot.slot_date} ${slot.slot_time}`);
    let penalty = 0;
    let isLate = false;

    if (now.isAfter(slotDateTime, 'minute')) {
      const lateMinutes = now.diff(slotDateTime, 'minutes');
      if (lateMinutes > slot.time_limit_minutes) {
        penalty = slot.time_delay_penalty;
        isLate = true;
      }
    }

    if (now.isAfter(moment(slot.slot_date))) {
      penalty = slot.date_delay_penalty;
      isLate = true;
    }

    // Insert saving activity
    const insertQuery = `
      INSERT INTO member_saving_activities (member_id, slot_id, saved_amount, penalty_applied, is_late)
      VALUES (@member_id, @slot_id, @saved_amount, @penalty, @isLate)
    `;

    await runQuery(insertQuery, [
      { name: 'member_id', type: sql.Int, value: member_id },
      { name: 'slot_id', type: sql.Int, value: slot_id },
      { name: 'saved_amount', type: sql.Decimal(18, 2), value: saved_amount },
      { name: 'penalty', type: sql.Decimal(18, 2), value: penalty },
      { name: 'isLate', type: sql.Bit, value: isLate }
    ]);

    // Update slot status
    const updateQuery = `UPDATE ikimina_saving_slots SET slot_status = 'saved' WHERE slot_id = @slot_id`;
    await runQuery(updateQuery, [{ name: 'slot_id', type: sql.Int, value: slot_id }]);

    res.json({ success: true, message: 'Saving successful', penaltyApplied: penalty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /savings/:member_id
router.get('/savings/:member_id', async (req, res) => {
  const { member_id } = req.params;

  try {
    const query = `
      SELECT a.*, s.slot_date, s.slot_time
      FROM member_saving_activities a
      JOIN ikimina_saving_slots s ON s.slot_id = a.slot_id
      WHERE a.member_id = @member_id
      ORDER BY s.slot_date
    `;

    const rows = await runQuery(query, [
      { name: 'member_id', type: sql.Int, value: member_id }
    ]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /summary/:iki_id
router.get('/summary/:iki_id', async (req, res) => {
  const { iki_id } = req.params;

  try {
    const query = `
      SELECT m.member_id, m.member_names,
             SUM(a.saved_amount) AS total_saved,
             COUNT(a.save_id) AS total_saves
      FROM members_info m
      LEFT JOIN member_saving_activities a ON m.member_id = a.member_id
      WHERE m.iki_id = @iki_id
      GROUP BY m.member_id, m.member_names
    `;

    const rows = await runQuery(query, [
      { name: 'iki_id', type: sql.Int, value: iki_id }
    ]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
