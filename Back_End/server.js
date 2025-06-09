const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db'); // <- This tests DB connection

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json()); // 🔥 Needed for POST/PUT body parsing

app.post('/api/register', async (req, res) => {
  const { fullNames, email, username, phone, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO users (FullNames, Email, Username, Phone, Password, Role) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [fullNames, email, username, phone, hashedPassword, role], err => {
    if (err) return res.status(500).json({ message: 'Error registering user' });
    res.status(200).json({ message: 'Registered successfully' });
  });
});


// 📊 API endpoint to fetch financial data from MySQL
app.get('/api/financial', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT name, amount FROM financial_data');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 📈 API endpoint to fetch financial status data
app.get('/api/financial_status_data', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM financial_status_data');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching financial status data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 👥 Get all members
app.get('/api/MemberData', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Members');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ➕ Add new member
app.post('/api/MemberData', async (req, res) => {
  const { name, email, status } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO Members (name, email, status) VALUES (?, ?, ?)',
      [name, email, status]
    );
    res.status(201).json({ id: result.insertId, name, email, status });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ✏️ Update member
app.put('/api/MemberData/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, status } = req.body;
  try {
    await db.execute(
      'UPDATE Members SET name = ?, email = ?, status = ? WHERE id = ?',
      [name, email, status, id]
    );
    res.status(200).json({ id, name, email, status });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ❌ Delete member
app.delete('/api/MemberData/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM Members WHERE id = ?', [id]);
    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
