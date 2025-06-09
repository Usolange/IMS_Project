// server.js

require('dotenv').config();           // Load .env variables first

const express = require('express');
const cors    = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔧 Middleware
app.use(cors());
app.use(express.json());

// 📦 Route imports
const supperAdminRoutes       = require('./routes/supperAdmin');
const frequencyCategoryRoutes = require('./routes/frequencyCategory');
const frequencyRouter         = require('./routes/frequency');
const ikiminaInfoRoutes       = require('./routes/ikiminaInfo');
const ikDailyTimeRoutes       = require('./routes/ikDailyTime');
const ikWeeklyTimeRoutes      = require('./routes/ikWeeklyTime');
const ikMonthlyTimeRoutes   = require('./routes/ikMonthlyTime');
// const memberTypeRoutes        = require('./routes/memberType');
// const gudianMembersRoutes     = require('./routes/gudianMembers');
const memberInfoRoutes        = require('./routes/membersInfo');
const memberAccessRoutes      = require('./routes/memberAccess');

// 🔌 Mount routes
app.use('/api/supperAdmin',       supperAdminRoutes);
app.use('/api/frequencyCategory', frequencyCategoryRoutes);
app.use('/api/frequency',         frequencyRouter);
app.use('/api/ikiminaInfo',       ikiminaInfoRoutes);
app.use('/api/ikDailyTime',       ikDailyTimeRoutes);
app.use('/api/ikWeeklyTime',      ikWeeklyTimeRoutes);
app.use('/api/ikMonthlyTime',     ikMonthlyTimeRoutes);
// app.use('/api/memberType',        memberTypeRoutes);
// app.use('/api/gudianMembers',     gudianMembersRoutes);
app.use('/api/membersinfo',       memberInfoRoutes);
// app.use('/api/memberAccess',      memberAccessRoutes);

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
