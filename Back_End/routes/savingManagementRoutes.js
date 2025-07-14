const express = require('express');
const router = express.Router();
const db = require('../config/db');
const moment = require('moment');

// POST /save/:member_id/:slot_id
router.post('/save/:member_id/:slot_id', async (req, res) => {
  const { member_id, slot_id } = req.params;
  const { saved_amount } = req.body;

  try {
    // Get slot info
    const [[slot]] = await db.query(`SELECT s.*, i.saving_ratio, i.time_limit_minutes, i.time_delay_penalty, i.date_delay_penalty
      FROM ikimina_saving_slots s
      JOIN ikimina_info ik ON s.iki_id = ik.iki_id
      JOIN ikimina_saving_rules i ON i.iki_id = ik.iki_id
      WHERE s.slot_id = ?`, [slot_id]);

    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    // Validate amount
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

    if (now.isAfter(slot.slot_date)) {
      penalty = slot.date_delay_penalty;
      isLate = true;
    }

    // Save activity
    await db.query(`INSERT INTO member_saving_activities (member_id, slot_id, saved_amount, penalty_applied, is_late)
                    VALUES (?, ?, ?, ?, ?)`,
      [member_id, slot_id, saved_amount, penalty, isLate]);

    // Update slot
    await db.query(`UPDATE ikimina_saving_slots SET slot_status = 'saved' WHERE slot_id = ?`, [slot_id]);

    res.json({ success: true, message: 'Saving successful', penaltyApplied: penalty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /savings/:member_id
router.get('/savings/:member_id', async (req, res) => {
  const { member_id } = req.params;
  const [rows] = await db.query(`SELECT a.*, s.slot_date, s.slot_time
                                 FROM member_saving_activities a
                                 JOIN ikimina_saving_slots s ON s.slot_id = a.slot_id
                                 WHERE a.member_id = ?
                                 ORDER BY s.slot_date`, [member_id]);
  res.json(rows);
});

// GET /summary/:iki_id
router.get('/summary/:iki_id', async (req, res) => {
  const { iki_id } = req.params;
  const [rows] = await db.query(`
    SELECT m.member_id, m.member_names, SUM(a.saved_amount) AS total_saved, COUNT(a.save_id) AS total_saves
    FROM members_info m
    LEFT JOIN member_saving_activities a ON m.member_id = a.member_id
    WHERE m.iki_id = ?
    GROUP BY m.member_id`, [iki_id]);
  res.json(rows);
});

module.exports = router;
