const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db'); // This tests DB connection

// Import routes
const userLoginRoutes = require('./routes/userLogin');
const supperAdminRoutes = require('./routes/supperAdmin');
const frequencyCategoryRoutes = require('./routes/frequencyCategory');
const ikiminaInfoRoutes = require('./routes/ikiminaInfo');
const ikDailyTimeRoutes = require('./routes/ikDailyTime');
const ikWeeklyTimeRoutes = require('./routes/ikWeeklyTime');
const ikMonthlyTimeRoutes = require('./routes/ikMonthlyTime');
const memberTypeRoutes = require('./routes/memberType');
const gudianMembersRoutes = require('./routes/gudianMembers');
const membersInfoRoutes = require('./routes/membersInfo');
const memberAccessRoutes = require('./routes/memberAccess');
const authenticateToken = require('./Middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Needed for POST/PUT body parsing

// Route Middleware
app.use('/api/userLogin', userLoginRoutes);
app.use('/api/supperAdmin', authenticateToken, supperAdminRoutes);
app.use('/api/frequencyCategory', authenticateToken, frequencyCategoryRoutes);
app.use('/api/ikiminaInfo', authenticateToken, ikiminaInfoRoutes);
app.use('/api/ikDailyTime', authenticateToken, ikDailyTimeRoutes);
app.use('/api/ikWeeklyTime', authenticateToken, ikWeeklyTimeRoutes);
app.use('/api/ikMonthlyTime', ikMonthlyTimeRoutes);
app.use('/api/memberType', authenticateToken, memberTypeRoutes);
app.use('/api/gudianMembers', gudianMembersRoutes);
app.use('/api/membersInfo', authenticateToken, membersInfoRoutes);
app.use('/api/memberAccess', authenticateToken, memberAccessRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
