require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config/db'); // ✅ only declared once

// Import routes
const supperAdminRoutes = require('./routes/supperAdmin');
const frequencyCategoryRoutes = require('./routes/frequencyCategory');
const ikiminaInfoRoutes = require('./routes/ikiminaInfo');
const ikDailyTimeRoutes = require('./routes/ikDailyTime');
const ikWeeklyTimeRoutes = require('./routes/ikWeeklyTime');
const ikMonthlyTimeRoutes = require('./routes/ikMonthlyTime');
const memberTypeRoutes = require('./routes/memberType');
const gudianMembersRoutes = require('./routes/gudianMembers');
const membersRoutes = require('./routes/members');
const memberInfoRoutes = require('./routes/membersInfo');
const memberAccessRoutes = require('./routes/memberAccess');
const frequencyRouter = require('./routes/frequency');

const app = express();
const PORT = process.env.PORT || 5000;



// Use Routes
app.use('/api/supperAdmin', supperAdminRoutes);
app.use('/api/frequencyCategory', frequencyCategoryRoutes);
app.use('/api/frequency', frequencyRouter);
app.use('/api/ikiminaInfo', ikiminaInfoRoutes);
app.use('/api/ikDailyTime', ikDailyTimeRoutes);
app.use('/api/ikWeeklyTime', ikWeeklyTimeRoutes);
app.use('/api/ikMonthlyTime', ikMonthlyTimeRoutes);
app.use('/api/memberType', memberTypeRoutes);
app.use('/api/gudianMembers', gudianMembersRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/membersinfo', memberInfoRoutes);
app.use('/api/memberAccess', memberAccessRoutes);
app.use('/api/membersfor', membersRoutesFor);
app.use('/api/financial', financial);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
