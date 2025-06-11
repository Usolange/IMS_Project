const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db'); // This tests DB connection

// Import routes
const userLoginRoutes = require('./routes/userLogin');
const supperAdminRoutes = require('./routes/supperAdmin');
const frequencyCategoryRoutes = require('./routes/frequencyCategory');
const ikiminaInfoRoutes = require('./routes/ikiminaInfo');
const DailyTimeRoutes = require('./routes/dailyTimeRoutes');
const WeeklyTimeRoutes = require('./routes/WeeklyTimeRoutes');
const MonthlyTimeRoutes = require('./routes/MonthlyTimeRoutes');
const memberTypeRoutes = require('./routes/memberType');
const gudianMembersRoutes = require('./routes/gudianMembers');
const membersInfoRoutes = require('./routes/membersInfo');
const memberAccessRoutes = require('./routes/memberAccess');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Needed for POST/PUT body parsing

// Route Middleware
app.use('/api/userLogin', userLoginRoutes);
app.use('/api/supperAdmin', supperAdminRoutes);
app.use('/api/frequencyCategory', frequencyCategoryRoutes);
app.use('/api/ikiminaInfo',  ikiminaInfoRoutes);
app.use('/api/ikDailyTime', DailyTimeRoutes);
app.use('/api/ikWeeklyTime',  WeeklyTimeRoutes);
app.use('/api/ikMonthlyTime', MonthlyTimeRoutes);
app.use('/api/memberType', memberTypeRoutes);
app.use('/api/gudianMembers', gudianMembersRoutes);
app.use('/api/membersInfo',  membersInfoRoutes);
app.use('/api/memberAccess',  memberAccessRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
