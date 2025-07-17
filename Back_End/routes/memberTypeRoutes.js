const express = require('express');
const router = express.Router();

const { sql, poolConnect, pool } = require('../config/db');

// Get all member types
router.get('/select', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM member_type_info');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching member types:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add a new member type
router.post('/newMemberType', async (req, res) => {
  const { member_type, type_desc } = req.body;

  if (!member_type || member_type.trim() === '') {
    return res.status(400).json({ message: 'Member Type is required.' });
  }
  if (member_type.trim().length < 3) {
    return res.status(400).json({ message: 'Member Type must be at least 3 characters.' });
  }

  try {
    const request = pool.request();
    request.input('member_type', sql.NVarChar(255), member_type.trim());
    request.input('type_desc', sql.NVarChar(sql.MAX), type_desc || null);

    // Insert and get inserted ID using OUTPUT or SCOPE_IDENTITY()
    const insertQuery = `
      INSERT INTO member_type_info (member_type, type_desc)
      VALUES (@member_type, @type_desc);
      SELECT CAST(SCOPE_IDENTITY() AS int) AS id;
    `;

    const result = await request.query(insertQuery);
    const insertedId = result.recordset[0].id;

    res.status(201).json({
      id: insertedId,
      member_type: member_type.trim(),
      type_desc: type_desc || ''
    });
  } catch (error) {
    console.error('Error adding member type:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update a member type
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { member_type, type_desc } = req.body;

  if (!member_type || member_type.trim() === '') {
    return res.status(400).json({ message: 'Member Type is required.' });
  }
  if (member_type.trim().length < 3) {
    return res.status(400).json({ message: 'Member Type must be at least 3 characters.' });
  }

  try {
    const request = pool.request();
    request.input('member_type', sql.NVarChar(255), member_type.trim());
    request.input('type_desc', sql.NVarChar(sql.MAX), type_desc || null);
    request.input('id', sql.Int, id);

    await request.query(
      `UPDATE member_type_info 
       SET member_type = @member_type, type_desc = @type_desc 
       WHERE member_type_id = @id`
    );

    res.status(200).json({ id, member_type: member_type.trim(), type_desc });
  } catch (error) {
    console.error('Error updating member type:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a member type
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM member_type_info WHERE member_type_id = @id');

    res.status(200).json({ message: 'Member type deleted successfully' });
  } catch (error) {
    console.error('Error deleting member type:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
