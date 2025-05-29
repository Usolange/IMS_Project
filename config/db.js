const mysql = require('mysql2');
require('dotenv').config(); // 👈 Make sure this is here

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // port: process.env.DB_PORT, // 👈 Optional, but good to include if using 3307
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL database');
});

module.exports = connection;
