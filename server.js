const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db'); // <- This tests DB connection

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


// Enable CORS for cross-origin requests
app.use(cors());
// API endpoint to fetch financial data from MySQL
app.get('/api/financial', async (req, res) => {
  try {
    // Fetch data from the database
    const [rows] = await db.execute('SELECT name, amount FROM financial_data');
    res.json(rows); // Send data as a JSON response
  } catch (error) {
    console.error('Error fetching financial data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.get('/api/financial_status_data', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM financial_status_data');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching financial status data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});





app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
