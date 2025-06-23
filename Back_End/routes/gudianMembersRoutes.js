const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Get all Gudian members
router.get('/select', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Gudian_members');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching Gudian members:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add a new Gudian member
router.post('/newGudianMember', async (req, res) => {
  const { gm_names, gm_Nid, gm_phonenumber } = req.body;
  if (!gm_names || !gm_Nid || !gm_phonenumber) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    await db.execute(
      `INSERT INTO gudian_members (gm_names, gm_Nid, gm_phonenumber) VALUES (?, ?, ?)`,
      [gm_names, gm_Nid, gm_phonenumber]
    );
    res.status(201).json({ message: 'Gudian member added successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add Gudian member.' });
  }
});

// Update a Gudian member
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, memberTypeId } = req.body;
  try {
    await db.execute(
      'UPDATE Gudian_members SET name = ?, member_type_id = ? WHERE id = ?',
      [name, memberTypeId, id]
    );
    res.status(200).json({ id, name, memberTypeId });
  } catch (error) {
    console.error('Error updating Gudian member:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a Gudian member
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM Gudian_members WHERE id = ?', [id]);
    res.status(200).json({ message: 'Gudian member deleted successfully' });
  } catch (error) {
    console.error('Error deleting Gudian member:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
