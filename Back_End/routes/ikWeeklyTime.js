router.post('/', async (req, res) => {
  const { ikimina_name, weeklytime_days, weeklytime_time, f_id } = req.body;

  if (!weeklytime_days || !weeklytime_time || !f_id || !ikimina_name) {
    return res.status(400).json({
      message: 'Missing required fields: weeklytime_days, weeklytime_time, f_id, and ikimina_name are all required.'
    });
  }

  if (!Array.isArray(weeklytime_days) || weeklytime_days.length === 0) {
    return res.status(400).json({
      message: 'weeklytime_days must be a non-empty array.'
    });
  }

  try {
    const insertPromises = weeklytime_days.map(day =>
      db.execute(
        `INSERT INTO Ik_weekly_time_info (ikimina_name, weeklytime_day, weeklytime_time, f_id)
         VALUES (?, ?, ?, ?)`,
        [ikimina_name.trim(), day.trim(), weeklytime_time, f_id]
      )
    );

    await Promise.all(insertPromises);

    return res.status(201).json({
      message: 'Weekly times added successfully.',
      added: weeklytime_days.map(day => day.trim())
    });
  } catch (error) {
    console.error('Error adding weekly times:', error.message);
    return res.status(500).json({
      message: 'Internal server error while adding weekly times.'
    });
  }
});
