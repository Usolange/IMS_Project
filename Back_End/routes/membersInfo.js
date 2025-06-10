const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 🔍 Get all members
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT mi.*, mt.m_type, ik.ik_name
      FROM Members_info mi
      LEFT JOIN Member_type_info mt ON mi.m_type_id = mt.m_type_id
      LEFT JOIN Ikimina_info ik ON mi.iki_id = ik.iki_id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching members_info:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ➕ Add new member
router.post('/', async (req, res) => {
  const {
    m_names,
    m_Nid,
    gm_Nid,
    m_phone_number,
    m_email,
    m_type_id,
    iki_id
  } = req.body;

  if (!m_Nid && !gm_Nid) {
    return res.status(400).json({ message: 'Either m_Nid or gm_Nid is required' });
  }

  if (!/^\d{10}$/.test(m_phone_number)) {
    return res.status(400).json({ message: 'Phone number must be 10 digits' });
  }

  try {
    const [result] = await db.execute(`
      INSERT INTO Members_info 
      (m_names, m_Nid, gm_Nid, m_phone_number, m_email, m_type_id, iki_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [m_names, m_Nid || null, gm_Nid || null, m_phone_number, m_email || null, m_type_id, iki_id]);

    res.status(201).json({ message: 'Member added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding member_info:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ✏️ Update member
router.put('/:m_id', async (req, res) => {
  const { m_id } = req.params;
  const {
    m_names,
    m_Nid,
    gm_Nid,
    m_phone_number,
    m_email,
    m_type_id,
    iki_id
  } = req.body;

  if (!m_Nid && !gm_Nid) {
    return res.status(400).json({ message: 'Either m_Nid or gm_Nid is required' });
  }

  if (!/^\d{10}$/.test(m_phone_number)) {
    return res.status(400).json({ message: 'Phone number must be 10 digits' });
  }

  try {
    await db.execute(`
      UPDATE Members_info SET 
        m_names = ?, 
        m_Nid = ?, 
        gm_Nid = ?, 
        m_phone_number = ?, 
        m_email = ?, 
        m_type_id = ?, 
        iki_id = ?
      WHERE m_id = ?
    `, [m_names, m_Nid || null, gm_Nid || null, m_phone_number, m_email || null, m_type_id, iki_id, m_id]);

    res.status(200).json({ message: 'Member updated successfully' });
  } catch (error) {
    console.error('Error updating member_info:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ❌ Delete member
router.delete('/:m_id', async (req, res) => {
  const { m_id } = req.params;

  try {
    await db.execute('DELETE FROM Members_info WHERE m_id = ?', [m_id]);
    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member_info:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
