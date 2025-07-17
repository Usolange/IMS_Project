require('dotenv').config();
const sql = require('mssql');

// Extract host and instance
const [serverName, instanceName] = process.env.DB_HOST.split('\\');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: serverName,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: instanceName
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on('error', err => {
  console.error('SQL Server connection error:', err);
});

module.exports = {
  sql,
  pool,
  poolConnect,
};
