const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ===========================
// Get all rounds for current Ikimina
// ===========================
router.get('/selectRounds', async (req, res) => {
  const iki_id = req.header('x-iki-id');
  if (!iki_id) {
    return res.status(400).json({ success: false, message: 'x-iki-id header missing' });
  }

  try {
    const [rows] = await db.query(
      `SELECT * FROM ikimina_rounds WHERE iki_id = ? ORDER BY round_number DESC`,
      [iki_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching rounds:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===========================
// Get last active or last round
// ===========================
router.get(['/getLastRound', '/getLastRound/:iki_id'], async (req, res) => {
  const iki_id = req.header('x-iki-id') || req.params.iki_id;
  if (!iki_id) {
    return res.status(400).json({ message: 'iki_id (via header or param) is required.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT * FROM ikimina_rounds WHERE iki_id = ? ORDER BY round_number DESC LIMIT 1`,
      [iki_id]
    );

    if (rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching last round:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


// ===========================
// Get round setup info (frequency, saving days, max categories)
// ===========================
router.get('/roundSetupInfo', async (req, res) => {
  const iki_id = req.header('x-iki-id');
  if (!iki_id) {
    return res.status(400).json({ message: 'x-iki-id header missing.' });
  }

  try {
    const [ikiInfo] = await db.query(
      `SELECT f.f_category AS frequency_name, i.weekly_saving_days, i.monthly_saving_days
       FROM ikimina_info i
       JOIN frequency_category_info f ON i.f_id = f.f_id
       WHERE i.iki_id = ?`,
      [iki_id]
    );

    if (ikiInfo.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found.' });
    }

    const frequencyName = ikiInfo[0].frequency_name;
    const freq = frequencyName.toLowerCase();
    const weeklyDays = ikiInfo[0].weekly_saving_days ? JSON.parse(ikiInfo[0].weekly_saving_days) : [];
    const monthlyDays = ikiInfo[0].monthly_saving_days ? JSON.parse(ikiInfo[0].monthly_saving_days) : [];

    let maxCategories = 0;
    if (freq === 'daily') {
      maxCategories = 365;
    } else if (freq === 'weekly') {
      maxCategories = Math.floor((52 * 7) / weeklyDays.length);  // Approx. max weeks in a year divided by weekly saving days
    } else if (freq === 'monthly') {
      maxCategories = Math.floor(12 / monthlyDays.length);  // Max months in a year divided by monthly saving days
    }

    // Fetch last round to propose next allowed start date
    const [lastRounds] = await db.query(
      `SELECT * FROM ikimina_rounds WHERE iki_id = ? ORDER BY round_number DESC LIMIT 1`,
      [iki_id]
    );

    let lastEndDate = lastRounds.length > 0 ? new Date(lastRounds[0].end_date) : null;
    let proposedStartDate = lastEndDate ? new Date(lastEndDate) : new Date();
    if (lastEndDate) {
      proposedStartDate.setDate(proposedStartDate.getDate() + 1);
    }

    if (freq === 'weekly') {
      const validDays = weeklyDays.map(d => d.toLowerCase());
      while (true) {
        const dayName = proposedStartDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (validDays.includes(dayName)) break;
        proposedStartDate.setDate(proposedStartDate.getDate() + 1);
      }
    } else if (freq === 'monthly') {
      while (true) {
        const dayOfMonth = proposedStartDate.getDate();
        if (monthlyDays.includes(dayOfMonth)) break;
        proposedStartDate.setDate(proposedStartDate.getDate() + 1);
      }
    }

    res.json({
      frequencyName,
      weeklyDays,
      monthlyDays,
      maxCategories,
      allowedStartDate: proposedStartDate.toISOString().split('T')[0]  // Return the allowed start date
    });
  } catch (err) {
    console.error('Error fetching setup info:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ===========================
// Create new round
// ===========================
router.post('/newRound', async (req, res) => {
  const iki_id_header = req.header('x-iki-id');
  const { start_date, number_of_categories, iki_id } = req.body;

  if (!iki_id_header) {
    return res.status(401).json({ message: 'x-iki-id header missing.' });
  }
  if (!start_date || number_of_categories === undefined) {
    return res.status(400).json({ message: 'start_date and number_of_categories are required.' });
  }
  if (parseInt(iki_id_header) !== parseInt(iki_id)) {
    return res.status(403).json({ message: 'Not authorized: iki_id does not match header.' });
  }

  try {
    const cycleYear = new Date(start_date).getFullYear();

    const [ikiInfo] = await db.query(
      `SELECT f.f_category AS frequency_name, i.weekly_saving_days, i.monthly_saving_days
       FROM ikimina_info i
       JOIN frequency_category_info f ON i.f_id = f.f_id
       WHERE i.iki_id = ?`,
      [iki_id_header]
    );

    if (ikiInfo.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found.' });
    }

    const frequencyName = ikiInfo[0].frequency_name;
    const freq = frequencyName.toLowerCase();
    const weeklyDays = ikiInfo[0].weekly_saving_days ? JSON.parse(ikiInfo[0].weekly_saving_days) : [];
    const monthlyDays = ikiInfo[0].monthly_saving_days ? JSON.parse(ikiInfo[0].monthly_saving_days) : [];

    let eventDates = [];

    if (freq === 'daily') {
      let current = new Date(start_date);
      for (let i = 0; i < number_of_categories; i++) {
        eventDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    } else if (freq === 'weekly') {
      if (weeklyDays.length === 0) {
        return res.status(400).json({ message: 'Weekly saving days not configured.' });
      }
      const validDays = weeklyDays.map(d => d.toLowerCase());
      let current = new Date(start_date);

      // Adjust the start date based on saving days
      const startDayName = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (!validDays.includes(startDayName)) {
        while (!validDays.includes(current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase())) {
          current.setDate(current.getDate() + 1);
        }
      }

      let saved = 0;
      while (saved < number_of_categories * validDays.length) {
        const dayName = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (validDays.includes(dayName)) {
          eventDates.push(new Date(current));
          saved++;
        }
        current.setDate(current.getDate() + 1);
      }
    } else if (freq === 'monthly') {
      if (monthlyDays.length === 0) {
        return res.status(400).json({ message: 'Monthly saving days not configured.' });
      }

      let saved = 0;
      let currentYear = new Date(start_date).getFullYear();
      let currentMonth = new Date(start_date).getMonth();
      let currentDate = new Date(start_date);

      while (saved < number_of_categories * monthlyDays.length) {
        for (let day of monthlyDays) {
          const date = new Date(currentYear, currentMonth, day);
          if (date >= currentDate) {
            eventDates.push(date);
            saved++;
            if (saved >= number_of_categories * monthlyDays.length) break;
          }
        }
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
    } else {
      return res.status(400).json({ message: `Unknown frequency category: ${frequencyName}` });
    }

    const end_date = eventDates[eventDates.length - 1].toISOString().split('T')[0];

    const [rounds] = await db.query(
      `SELECT MAX(round_number) AS max_round FROM ikimina_rounds WHERE iki_id = ?`,
      [iki_id_header]
    );
    const nextRoundNumber = rounds[0]?.max_round + 1 || 1;

    await db.query(
      `INSERT INTO ikimina_rounds (iki_id, round_number, cycle_year, start_date, end_date, round_status, number_of_categories) 
       VALUES (?, ?, ?, ?, ?, 'upcoming', ?)`,
      [iki_id_header, nextRoundNumber, cycleYear, start_date, end_date, number_of_categories]
    );

    res.status(201).json({ message: 'Round created successfully.', end_date });
  } catch (err) {
    console.error('Error creating round:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ===========================
// Update round
// ===========================
router.put('/updateRound/:round_id', async (req, res) => {
  const iki_id_header = req.header('x-iki-id');
  const { round_id } = req.params;
  const { start_date, number_of_categories } = req.body;

  if (!iki_id_header) {
    return res.status(401).json({ message: 'x-iki-id header missing.' });
  }
  if (!start_date || number_of_categories === undefined) {
    return res.status(400).json({ message: 'start_date and number_of_categories are required.' });
  }

  try {
    const [round] = await db.query(`SELECT * FROM ikimina_rounds WHERE round_id = ?`, [round_id]);
    if (round.length === 0) {
      return res.status(404).json({ message: 'Round not found.' });
    }
    if (parseInt(round[0].iki_id) !== parseInt(iki_id_header)) {
      return res.status(403).json({ message: 'Not authorized: iki_id does not match header.' });
    }

    const [ikiInfo] = await db.query(
      `SELECT f.f_category AS frequency_name, i.weekly_saving_days, i.monthly_saving_days
       FROM ikimina_info i
       JOIN frequency_category_info f ON i.f_id = f.f_id
       WHERE i.iki_id = ?`,
      [iki_id_header]
    );

    if (ikiInfo.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found.' });
    }

    const frequencyName = ikiInfo[0].frequency_name;
    const freq = frequencyName.toLowerCase();
    const weeklyDays = ikiInfo[0].weekly_saving_days ? JSON.parse(ikiInfo[0].weekly_saving_days) : [];
    const monthlyDays = ikiInfo[0].monthly_saving_days ? JSON.parse(ikiInfo[0].monthly_saving_days) : [];

    // Check allowed start date based on last round
    const [lastRounds] = await db.query(
      `SELECT * FROM ikimina_rounds WHERE iki_id = ? ORDER BY round_number DESC LIMIT 1`,
      [iki_id_header]
    );

    let lastEndDate = lastRounds.length > 0 ? new Date(lastRounds[0].end_date) : null;
    let proposedStartDate = lastEndDate ? new Date(lastEndDate) : new Date();
    if (lastEndDate) {
      proposedStartDate.setDate(proposedStartDate.getDate() + 1);
    }

    if (freq === 'weekly') {
      const validDays = weeklyDays.map(d => d.toLowerCase());
      while (true) {
        const dayName = proposedStartDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (validDays.includes(dayName)) break;
        proposedStartDate.setDate(proposedStartDate.getDate() + 1);
      }
    } else if (freq === 'monthly') {
      while (true) {
        const dayOfMonth = proposedStartDate.getDate();
        if (monthlyDays.includes(dayOfMonth)) break;
        proposedStartDate.setDate(proposedStartDate.getDate() + 1);
      }
    }

    const startDateObj = new Date(start_date);
    if (startDateObj < proposedStartDate) {
      return res.status(400).json({ message: `Start date must be after last round end date (${proposedStartDate.toISOString().split('T')[0]} or later).`, allowedStartDate: proposedStartDate.toISOString().split('T')[0] });
    }

    // Generate event dates
    let eventDates = [];
    if (freq === 'daily') {
      let current = new Date(start_date);
      for (let i = 0; i < number_of_categories; i++) {
        eventDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    } else if (freq === 'weekly') {
      let current = new Date(start_date);
      let saved = 0;
      while (saved < number_of_categories * weeklyDays.length) {
        const dayName = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (weeklyDays.map(d => d.toLowerCase()).includes(dayName)) {
          eventDates.push(new Date(current));
          saved++;
        }
        current.setDate(current.getDate() + 1);
      }
    } else if (freq === 'monthly') {
      let saved = 0;
      let currentYear = startDateObj.getFullYear();
      let currentMonth = startDateObj.getMonth();
      const monthStart = new Date(start_date);

      while (saved < number_of_categories * monthlyDays.length) {
        for (let day of monthlyDays) {
          const date = new Date(currentYear, currentMonth, day);
          if (date >= monthStart) {
            eventDates.push(date);
            saved++;
            if (saved >= number_of_categories * monthlyDays.length) break;
          }
        }
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
    }

    const end_date = eventDates[eventDates.length - 1].toISOString().split('T')[0];

    await db.query(
      `UPDATE ikimina_rounds 
       SET start_date = ?, end_date = ?, round_status = 'upcoming', number_of_categories = ? 
       WHERE round_id = ?`,
      [start_date, end_date, number_of_categories, round_id]
    );

    res.status(200).json({ message: 'Round updated successfully.' });
  } catch (err) {
    console.error('Error updating round:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ===========================
// Delete round
// ===========================
router.delete('/deleteRound/:round_id', async (req, res) => {
  const iki_id_header = req.header('x-iki-id');
  const { round_id } = req.params;

  if (!iki_id_header) {
    return res.status(401).json({ message: 'x-iki-id header missing.' });
  }

  try {
    const [round] = await db.query(`SELECT * FROM ikimina_rounds WHERE round_id = ?`, [round_id]);

    if (round.length === 0) {
      return res.status(404).json({ message: 'Round not found.' });
    }
    if (parseInt(round[0].iki_id) !== parseInt(iki_id_header)) {
      return res.status(403).json({ message: 'Not authorized: iki_id does not match header.' });
    }
    if (round[0].round_status === 'active' || round[0].round_status === 'completed') {
      return res.status(403).json({ message: `Cannot delete a round that is ${round[0].round_status}.` });
    }

    await db.query(`DELETE FROM ikimina_rounds WHERE round_id = ?`, [round_id]);

    res.json({ message: 'Round deleted successfully.' });
  } catch (err) {
    console.error('Error deleting round:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;