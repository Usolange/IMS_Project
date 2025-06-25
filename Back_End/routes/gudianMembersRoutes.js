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

// Check if guardian has assigned members
router.get('/check-assigned/:gm_Nid', async (req, res) => {
  const { gm_Nid } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT COUNT(*) AS count FROM members_info WHERE gm_Nid = ?',
      [gm_Nid]
    );
    res.json({ assignedCount: rows[0].count });
  } catch (error) {
    console.error('Error checking guardian assignments:', error);
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

router.put('/:gm_id', async (req, res) => {
  const { gm_id } = req.params;
  const { gm_names, gm_Nid, gm_phonenumber, iki_id } = req.body;

  // Basic validation
  if (!gm_names || !gm_Nid || !gm_phonenumber || !iki_id) {
    return res.status(400).json({ success: false, message: 'Required fields missing: gm_names, gm_Nid, gm_phonenumber, iki_id.' });
  }

  try {
    // Check if guardian exists and belongs to this iki_id (ownership)
    const [existing] = await db.execute('SELECT * FROM gudian_members WHERE gm_id = ? AND iki_id = ?', [gm_id, iki_id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Guardian member not found or does not belong to you.' });
    }

    // OPTIONAL: Check for duplicate NID in gudian_members (if you want to prevent duplicate NIDs)
    const [nidCheck] = await db.execute(
      'SELECT gm_id FROM gudian_members WHERE gm_Nid = ? AND gm_id != ?',
      [gm_Nid, gm_id]
    );
    if (nidCheck.length > 0) {
      return res.status(409).json({ success: false, message: 'Another guardian with this National ID already exists.' });
    }

    // Update
    const [result] = await db.execute(
      `UPDATE gudian_members SET
        gm_names = ?,
        gm_Nid = ?,
        gm_phonenumber = ?
      WHERE gm_id = ? AND iki_id = ?`,
      [gm_names, gm_Nid, gm_phonenumber, gm_id, iki_id]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'Failed to update guardian member.' });
    }

    res.json({ success: true, message: 'Guardian member updated successfully.' });
  } catch (error) {
    console.error('Error updating guardian member:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error while updating guardian member.' });
  }
});


// Delete a Gudian member
router.delete('/:gm_id', async (req, res) => {
  const { gm_id } = req.params;
  const { iki_id } = req.body; // or req.query, depending on your frontend

  if (!iki_id) {
    return res.status(400).json({ success: false, message: 'iki_id is required for authorization.' });
  }

  try {
    // Check if guardian exists and belongs to this iki_id
    const [guardianRows] = await db.execute('SELECT * FROM gudian_members WHERE gm_id = ? AND iki_id = ?', [gm_id, iki_id]);
    if (guardianRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Guardian member not found or unauthorized.' });
    }

    const guardian = guardianRows[0];

    // Check if this guardian has any members linked (by gm_Nid)
    const [linkedMembers] = await db.execute('SELECT member_id FROM members_info WHERE gm_Nid = ?', [guardian.gm_Nid]);
    if (linkedMembers.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete guardian "${guardian.gm_names}" because they have ${linkedMembers.length} member(s) linked.`
      });
    }

    // Safe to delete
    const [deleteResult] = await db.execute('DELETE FROM gudian_members WHERE gm_id = ? AND iki_id = ?', [gm_id, iki_id]);
    if (deleteResult.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'Failed to delete guardian member.' });
    }

    res.json({ success: true, message: 'Guardian member deleted successfully.' });
  } catch (error) {
    console.error('Error deleting guardian member:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error while deleting guardian member.' });
  }
});


module.exports = router;
