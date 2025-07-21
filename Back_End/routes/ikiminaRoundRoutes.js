const express = require('express');
const router = express.Router();
const { sql, poolConnect, pool } = require('../config/db');
// Convert a YYYY-MM-DD string to a Date in local time (00:00:00)
function parseLocalDate(dateStr) {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Format Date object to YYYY-MM-DD local time string
function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Validate if start date matches frequency and allowed days
function isValidStartDate(startDate, frequency, validDays) {
  const date = new Date(startDate);

  if (frequency === 'daily') return true;

  if (frequency === 'weekly') {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return validDays.map(d => d.toLowerCase()).includes(weekday);
  }

  if (frequency === 'monthly') {
    const day = date.getDate();
    return validDays.includes(day);
  }

  return false;
}

// Kigali timezone offset in milliseconds (+3 hours)
const KIGALI_OFFSET_MS = 3 * 60 * 60 * 1000;

function convertUTCDateToKigaliDate(date) {
  return new Date(date.getTime() + KIGALI_OFFSET_MS);
}

// Convert Kigali date to UTC (subtract 3 hours)
function convertKigaliDateToUTC(date) {
  return new Date(date.getTime() - KIGALI_OFFSET_MS);
}

// Create a Kigali date from Y-M-D (returns a Date object in local time)
function createKigaliDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day) - KIGALI_OFFSET_MS);
}

// Format date to YYYY-MM-DD in Kigali timezone
function dateToYMDStringKigali(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Invalid date passed to dateToYMDStringKigali:', date);
    return null;
  }
  const kigaliDate = convertUTCDateToKigaliDate(date);
  return kigaliDate.toISOString().slice(0, 10);
}

// Get today's date string in Kigali timezone (YYYY-MM-DD)
function getTodayDateStringKigali() {
  const nowUTC = new Date();
  const nowKigali = convertUTCDateToKigaliDate(nowUTC);
  return nowKigali.toISOString().slice(0, 10);
}


// -- Routes --
router.patch('/updateRoundStatus/:round_id', async (req, res) => {
  const { round_id } = req.params;
  const { round_status } = req.body;

  if (!round_status) {
    return res.status(400).json({ success: false, message: 'Missing round_status in request body' });
  }

  try {
    await poolConnect;
    const result = await pool.request()
      .input('round_id', sql.Int, round_id)
      .input('round_status', sql.VarChar, round_status)
      .query(`
        UPDATE ikimina_rounds
        SET round_status = @round_status
        WHERE round_id = @round_id
      `);

    res.status(200).json({ success: true, message: 'Round status updated successfully' });

  } catch (err) {
    console.error('Error updating round status:', err);
    res.status(500).json({ success: false, message: 'Database error updating round' });
  }
});

// GET round setup info
router.get('/roundSetupInfo', async (req, res) => {
  const iki_id = req.header('x-iki-id');
  if (!iki_id) {
    return res.status(400).json({ message: 'x-iki-id header missing.' });
  }

  try {
    await poolConnect;
    const request = pool.request();
    request.input('iki_id', sql.Int, iki_id);

    const result1 = await request.query(`
      SELECT f.f_category AS frequency_name, i.weekly_saving_days, i.monthly_saving_days
      FROM ikimina_info i
      JOIN frequency_category_info f ON i.f_id = f.f_id
      WHERE i.iki_id = @iki_id
    `);

    if (result1.recordset.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found.' });
    }

    const info = result1.recordset[0];
    const frequencyName = info.frequency_name;
    const freq = frequencyName.toLowerCase();

    let weeklyDays = [];
    let monthlyDays = [];

    try {
      weeklyDays = info.weekly_saving_days ? JSON.parse(info.weekly_saving_days) : [];
      monthlyDays = info.monthly_saving_days ? JSON.parse(info.monthly_saving_days) : [];
    } catch (err) {
      console.error('Error parsing weekly/monthly days JSON:', err);
      // Fail gracefully with empty arrays
      weeklyDays = [];
      monthlyDays = [];
    }

    let maxCategories = 0;
    if (freq === 'daily') maxCategories = 365;
    else if (freq === 'weekly') maxCategories = Math.floor(365 / 7);
    else if (freq === 'monthly') maxCategories = 12;

    // Fetch last round
    const result2 = await request.query(`
      SELECT TOP 1 * FROM ikimina_rounds WHERE iki_id = @iki_id ORDER BY round_number DESC
    `);

    let lastEndDate = result2.recordset.length > 0 ? new Date(result2.recordset[0].end_date) : null;
    let proposedStartDate = lastEndDate ? new Date(lastEndDate) : new Date();
    if (lastEndDate) proposedStartDate.setDate(proposedStartDate.getDate() + 1);
    proposedStartDate.setHours(0, 0, 0, 0);

    // Add max iteration guards to prevent infinite loops
    const MAX_ITER = 365;

    if (freq === 'weekly' && weeklyDays.length > 0) {
      const validDaysLower = weeklyDays.map(d => d.toLowerCase());
      let iter = 0;
      while (iter < MAX_ITER) {
        const dayName = proposedStartDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (validDaysLower.includes(dayName)) break;
        proposedStartDate.setDate(proposedStartDate.getDate() + 1);
        iter++;
      }
      if (iter === MAX_ITER) {
        // Could not find a valid day in a year, fallback to null
        proposedStartDate = null;
      }
    } else if (freq === 'monthly' && monthlyDays.length > 0) {
      let iter = 0;
      while (iter < MAX_ITER) {
        const dayOfMonth = proposedStartDate.getDate();
        if (monthlyDays.includes(dayOfMonth)) break;
        proposedStartDate.setDate(proposedStartDate.getDate() + 1);
        iter++;
      }
      if (iter === MAX_ITER) {
        proposedStartDate = null;
      }
    }

    const allowedStartDate = proposedStartDate ? formatDateLocal(proposedStartDate) : null;

    res.json({
      frequencyName,
      weeklyDays,
      monthlyDays,
      maxCategories,
      allowedStartDate
    });
  } catch (err) {
    console.error('Error fetching setup info:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


// GET last round (header or param iki_id)
router.get(['/getLastRound', '/getLastRound/:iki_id'], async (req, res) => {
  const iki_id = req.header('x-iki-id') || req.params.iki_id;
  if (!iki_id) {
    return res.status(400).json({ message: 'iki_id (via header or param) is required.' });
  }

  try {
    const result = await pool.request()
      .input('iki_id', sql.Int, iki_id)
      .query(`
        SELECT TOP 1 * FROM ikimina_rounds WHERE iki_id = @iki_id ORDER BY round_number DESC
      `);

    if (result.recordset.length === 0) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error('Error fetching last round:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET all rounds for current Ikimina
router.get('/selectRounds', async (req, res) => {
  const iki_id = req.headers['x-iki-id'];
  if (!iki_id) {
    return res.status(400).json({ success: false, message: 'x-iki-id header missing.' });
  }

  try {
    await poolConnect;
    const result = await pool.request()
      .input('iki_id', sql.Int, iki_id)
      .query('SELECT * FROM ikimina_rounds WHERE iki_id = @iki_id ORDER BY start_date ASC');

   

    return res.status(200).json({ success: true, data: result.recordset || [] });
  } catch (err) {
    console.error('Error fetching rounds:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch rounds' });
  }
});


// Helper functions (put these somewhere reusable)

function parseLocalDate(dateStr) {
  // Parses 'YYYY-MM-DD' string to local Date at midnight
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateLocal(date) {
  // Formats a Date object as 'YYYY-MM-DD'
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayDateStringKigali() {
  // Return today's date string in Kigali timezone (UTC+2)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kigaliOffset = 2 * 60 * 60000;
  const kigaliDate = new Date(utc + kigaliOffset);
  return formatDateLocal(kigaliDate);
}

function convertKigaliDateToUTC(date) {

  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function getEndDateByCycles(startDate, savingDays, numberOfCategories, freq) {
  const totalSavingDays = numberOfCategories * (savingDays.length || 1); 
  // For daily, savingDays.length == 0, so totalSavingDays = numberOfCategories

  // Normalize savingDays for weekly (to lowercase strings) or monthly (numbers)
  const savingDaysLower = savingDays.map(d => (typeof d === 'string' ? d.toLowerCase() : d));

  let count = 0;
  let currentDate = new Date(startDate);

  while (count < totalSavingDays) {
    if (freq === 'weekly') {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (savingDaysLower.includes(dayName)) {
        count++;
        if (count === totalSavingDays) break;
      }
    } else if (freq === 'monthly') {
      const dayNum = currentDate.getDate();
      if (savingDaysLower.includes(dayNum)) {
        count++;
        if (count === totalSavingDays) break;
      }
    } else if (freq === 'daily') {
      // Every calendar day counts
      count++;
      if (count === totalSavingDays) break;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return currentDate;
}

// POST create new round
router.post('/newRound', async (req, res) => {
  const iki_id = req.header('x-iki-id');
  const body = req.body;

  if (!iki_id || parseInt(iki_id) !== parseInt(body.iki_id)) {
    return res.status(403).json({ message: 'Unauthorized ikimina ID mismatch.' });
  }

  if (!body.start_date || !body.number_of_categories) {
    return res.status(400).json({ message: 'start_date and number_of_categories are required.' });
  }

  const startDate = parseLocalDate(body.start_date);
  if (!startDate) {
    return res.status(400).json({ message: 'Invalid start_date format. Use YYYY-MM-DD.' });
  }

  const numberOfCategories = parseInt(body.number_of_categories, 10);
  if (isNaN(numberOfCategories) || numberOfCategories <= 0) {
    return res.status(400).json({ message: 'number_of_categories must be a positive integer.' });
  }

  try {
    await poolConnect;

    // Fetch ikimina frequency info
    const freqRequest = pool.request();
    freqRequest.input('iki_id', sql.Int, iki_id);
    const freqRes = await freqRequest.query(`
      SELECT f.f_category AS frequency_name, i.weekly_saving_days, i.monthly_saving_days
      FROM ikimina_info i
      JOIN frequency_category_info f ON i.f_id = f.f_id
      WHERE i.iki_id = @iki_id
    `);

    if (freqRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found.' });
    }

    const info = freqRes.recordset[0];
    const freq = info.frequency_name.toLowerCase();
    const weeklyDays = info.weekly_saving_days ? JSON.parse(info.weekly_saving_days) : [];
    const monthlyDays = info.monthly_saving_days ? JSON.parse(info.monthly_saving_days) : [];

    // Validate number_of_categories max limits
    const maxCategories = freq === 'daily' ? 365 : freq === 'weekly' ? 52 : 12;
    if (numberOfCategories > maxCategories) {
      return res.status(400).json({
        message: `number_of_categories cannot exceed ${maxCategories} for ${freq} frequency.`,
      });
    }

    // Get current Kigali date
    const todayKigaliStr = getTodayDateStringKigali();
    const todayKigaliDate = parseLocalDate(todayKigaliStr);

    // Fetch last round to get last end_date
    const lastRoundRequest = pool.request();
    lastRoundRequest.input('iki_id', sql.Int, iki_id);
    const lastRoundRes = await lastRoundRequest.query(`
      SELECT TOP 1 * FROM ikimina_rounds WHERE iki_id = @iki_id ORDER BY round_number DESC
    `);
    const lastRound = lastRoundRes.recordset.length > 0 ? lastRoundRes.recordset[0] : null;
    const lastEndDate = lastRound ? parseLocalDate(lastRound.end_date.toISOString().slice(0, 10)) : null;

    // Validate start_date not before today or last round's end_date
    if (!lastRound) {
      if (startDate < todayKigaliDate) {
        return res.status(400).json({ message: 'Start date cannot be in the past.' });
      }
    } else {
      if (startDate <= lastEndDate) {
        return res.status(400).json({
          message: "Start date must be strictly after current round's end date.",
        });
      }
    }

    // Check start_date validity for weekly/monthly
    function isStartDateAllowed(date) {
      if (freq === 'daily') return true;
      if (freq === 'weekly') {
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
        return weeklyDays.includes(weekday);
      }
      if (freq === 'monthly') {
        return monthlyDays.includes(date.getDate());
      }
      return false;
    }

    if (!isStartDateAllowed(startDate)) {
      if (freq === 'weekly') {
        return res.status(400).json({
          message: `Start date must be one of the allowed weekly saving days: ${weeklyDays.join(', ')}`,
        });
      } else if (freq === 'monthly') {
        return res.status(400).json({
          message: `Start date must be one of the allowed monthly saving dates: ${monthlyDays.join(', ')}`,
        });
      }
    }

    // Calculate end date by mapping saving days on calendar
    const savingDays = freq === 'weekly' ? weeklyDays : freq === 'monthly' ? monthlyDays : [];
    const endDate = getEndDateByCycles(startDate, savingDays, numberOfCategories, freq);

    if (endDate < startDate) {
      return res.status(400).json({ message: 'Calculated end_date cannot be before start_date.' });
    }

    // set round status default
    let roundStatus = 'upcoming';
   // Determine round number and year
    const roundNumber = lastRound && lastRound.round_number ? lastRound.round_number + 1 : 1;
    const roundYear = startDate.getFullYear();

    // Insert new round into DB
    const insertRequest = pool.request();
    insertRequest.input('start_date', sql.Date, convertKigaliDateToUTC(startDate));
    insertRequest.input('end_date', sql.Date, convertKigaliDateToUTC(endDate));
    insertRequest.input('round_number', sql.Int, roundNumber);
    insertRequest.input('round_year', sql.Int, roundYear);
    insertRequest.input('round_status', sql.VarChar(20), roundStatus);
    insertRequest.input('number_of_categories', sql.Int, numberOfCategories);
    insertRequest.input('iki_id', sql.Int, iki_id);

    const insertResult = await insertRequest.query(`
      INSERT INTO ikimina_rounds
        (start_date, end_date, round_number, round_year, round_status, number_of_categories, iki_id)
      VALUES
        (@start_date, @end_date, @round_number, @round_year, @round_status, @number_of_categories, @iki_id);

      SELECT * FROM ikimina_rounds WHERE iki_id = @iki_id AND round_number = @round_number;
    `);

    const createdRound = insertResult.recordset.length > 0 ? insertResult.recordset[0] : null;

const updateStatusRequest = pool.request();
updateStatusRequest.input('iki_id', sql.Int, iki_id);

if (roundStatus === 'active') {
  // When round is active, set members to 'active' who belong to this ikimina
  await updateStatusRequest.query(`
    UPDATE members_info
    SET m_status = 'active'
    WHERE iki_id = @iki_id;
  `);
} else if (roundStatus === 'upcoming') {
  // When round is upcoming, set members to 'waiting' or some status indicating not active yet
  await updateStatusRequest.query(`
    UPDATE members_info
    SET m_status = 'waiting'
    WHERE iki_id = @iki_id;
  `);
} else if (roundStatus === 'completed') {
  // When round is completed, set members to 'inactive' or 'completed' status
  await updateStatusRequest.query(`
    UPDATE members_info
    SET m_status = 'inactive'
    WHERE iki_id = @iki_id;
  `);
}

    return res.status(201).json({
      success: true,
      message: 'Round created successfully.',
      data: createdRound,
    });

  } catch (err) {
    console.error('❌ Error creating new round:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});


// PUT update existing round
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
  if (!Number.isInteger(number_of_categories) || number_of_categories <= 0) {
    return res.status(400).json({ message: 'number_of_categories must be a positive integer.' });
  }

  const startDateObj = parseLocalDate(start_date);
  if (!startDateObj) {
    return res.status(400).json({ message: 'Invalid start_date format. Use YYYY-MM-DD.' });
  }

  try {
    await poolConnect;

    // Fetch the round to update
    const roundResult = await pool.request()
      .input('round_id', sql.Int, round_id)
      .query(`SELECT * FROM ikimina_rounds WHERE round_id = @round_id`);

    if (roundResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Round not found.' });
    }

    const round = roundResult.recordset[0];
    const roundStatus = round.round_status.toLowerCase(); // ✅ Needed

    // Prevent update if round is active or completed
    if (roundStatus === 'active' || roundStatus === 'completed') {
      return res.status(400).json({ message: `Cannot update a ${roundStatus} round.` });
    }

    // Authorization check
    if (parseInt(iki_id_header) !== round.iki_id) {
      return res.status(403).json({ message: 'Unauthorized to update this round.' });
    }

    // Fetch ikimina frequency info
    const ikiInfoResult = await pool.request()
      .input('iki_id', sql.Int, round.iki_id)
      .query(`
        SELECT f.f_category AS frequency_name, i.weekly_saving_days, i.monthly_saving_days
        FROM ikimina_info i
        JOIN frequency_category_info f ON i.f_id = f.f_id
        WHERE i.iki_id = @iki_id
      `);

    if (ikiInfoResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Ikimina not found.' });
    }

    const frequencyName = ikiInfoResult.recordset[0].frequency_name;
    const freq = frequencyName.toLowerCase();

    let weeklyDays = [];
    let monthlyDays = [];
    try {
      weeklyDays = ikiInfoResult.recordset[0].weekly_saving_days
        ? JSON.parse(ikiInfoResult.recordset[0].weekly_saving_days)
        : [];
      monthlyDays = ikiInfoResult.recordset[0].monthly_saving_days
        ? JSON.parse(ikiInfoResult.recordset[0].monthly_saving_days)
        : [];
    } catch (err) {
      console.error('Error parsing weekly/monthly days JSON:', err);
    }

    // Validate start_date
    function isValidStartDate(date, frequency, allowedDays) {
      if (frequency === 'daily') return true;
      if (frequency === 'weekly') {
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
        return allowedDays.includes(weekday);
      }
      if (frequency === 'monthly') {
        return allowedDays.includes(date.getDate());
      }
      return false;
    }

    if (!isValidStartDate(startDateObj, freq, freq === 'weekly' ? weeklyDays : freq === 'monthly' ? monthlyDays : [])) {
      return res.status(400).json({ message: `start_date does not match allowed saving days for frequency '${freq}'.` });
    }

    // Calculate end date
    const savingDays = freq === 'weekly' ? weeklyDays : freq === 'monthly' ? monthlyDays : [];
    const newEndDate = getEndDateByCycles(startDateObj, savingDays, number_of_categories, freq);
    if (newEndDate < startDateObj) {
      return res.status(400).json({ message: 'Calculated end_date cannot be before start_date.' });
    }

    // Update round info
    await pool.request()
      .input('round_id', sql.Int, round_id)
      .input('start_date', sql.Date, convertKigaliDateToUTC(startDateObj))
      .input('end_date', sql.Date, convertKigaliDateToUTC(newEndDate))
      .input('number_of_categories', sql.Int, number_of_categories)
      .query(`
        UPDATE ikimina_rounds
        SET start_date = @start_date,
            end_date = @end_date,
            number_of_categories = @number_of_categories
        WHERE round_id = @round_id
      `);

    // Auto update member status if roundStatus is still 'upcoming'
    const updateStatusRequest = pool.request().input('iki_id', sql.Int, round.iki_id);

    if (roundStatus === 'upcoming') {
      await updateStatusRequest.query(`
        UPDATE members_info
        SET m_status = 'waiting'
        WHERE iki_id = @iki_id;
      `);
    }

    return res.json({
      message: 'Round updated successfully.',
      end_date: formatDateLocal(newEndDate),
    });

  } catch (error) {
    console.error('Error updating round:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE a round by round_id
router.delete('/deleteRound/:round_id', async (req, res) => {
  const iki_id_header = req.header('x-iki-id');
  const { round_id } = req.params;

  if (!iki_id_header) {
    return res.status(401).json({ message: 'x-iki-id header missing.' });
  }

  if (!round_id) {
    return res.status(400).json({ message: 'round_id param is required.' });
  }

  try {
    // Fetch round details
    const result = await pool.request()
      .input('round_id', sql.Int, round_id)
      .query(`SELECT iki_id, round_status FROM ikimina_rounds WHERE round_id = @round_id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Round not found.' });
    }

    const round = result.recordset[0];

    // Ensure the round belongs to the current ikimina
    if (parseInt(round.iki_id) !== parseInt(iki_id_header)) {
      return res.status(403).json({ message: 'Unauthorized to delete this round.' });
    }

    // Prevent deletion of active or completed rounds
    const status = round.round_status.toLowerCase();
    if (status === 'active' || status === 'completed') {
      return res.status(400).json({ message: `You cannot delete a ${status} round.` });
    }

    // Safe to delete
    await pool.request()
      .input('round_id', sql.Int, round_id)
      .query(`DELETE FROM ikimina_rounds WHERE round_id = @round_id`);

    return res.json({ message: 'Round deleted successfully.' });

  } catch (error) {
    console.error('Error deleting round:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});


module.exports = router;