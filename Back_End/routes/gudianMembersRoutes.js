const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Get all Gudian members, optionally filtered by iki_id
router.get('/select', async (req, res) => {
  try {
    const { iki_id } = req.query;
    let query = 'SELECT gm_id, gm_names, gm_Nid, gm_phonenumber, iki_id FROM gudian_members';
    const params = [];

    if (iki_id) {
      query += ' WHERE iki_id = ?';
      params.push(iki_id);
    }

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching Gudian members:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add a new Gudian member
router.post('/newGudianMember', async (req, res) => {
  const { gm_names, gm_Nid, gm_phonenumber, iki_id } = req.body;

  if (!gm_names || !gm_Nid || !gm_phonenumber || !iki_id) {
    return res.status(400).json({ message: 'All fields including iki_id are required.' });
  }

  try {
    await db.execute(
      'INSERT INTO gudian_members (gm_names, gm_Nid, gm_phonenumber, iki_id) VALUES (?, ?, ?, ?)',
      [gm_names, gm_Nid, gm_phonenumber, iki_id]
    );
    res.status(201).json({ message: 'Gudian member added successfully.' });
  } catch (err) {
    console.error('Error adding Gudian member:', err);
    res.status(500).json({ message: 'Failed to add Gudian member.' });
  }
});

// Update a Gudian member
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { gm_names, gm_Nid, gm_phonenumber } = req.body;

  if (!gm_names || !gm_Nid || !gm_phonenumber) {
    return res.status(400).json({ message: 'All fields are required for update.' });
  }

  try {
    const [result] = await db.execute(
      'UPDATE gudian_members SET gm_names = ?, gm_Nid = ?, gm_phonenumber = ? WHERE gm_id = ?',
      [gm_names, gm_Nid, gm_phonenumber, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Gudian member not found.' });
    }

    res.status(200).json({ message: 'Gudian member updated successfully.' });
  } catch (error) {
    console.error('Error updating Gudian member:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a Gudian member
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM gudian_members WHERE gm_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Gudian member not found.' });
    }
    res.status(200).json({ message: 'Gudian member deleted successfully' });
  } catch (error) {
    console.error('Error deleting Gudian member:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
