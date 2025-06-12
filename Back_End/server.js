const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

const userLoginRoutes = require('./routes/userLogin');
const supperAdminRoutes = require('./routes/supperAdmin');
const frequencyCategoryRoutes = require('./routes/frequencyCategory');
const ikiminaInfoRoutes = require('./routes/ikiminaInfo');
const DailyTimeRoutes = require('./routes/dailyTimeRoutes');
const WeeklyTimeRoutes = require('./routes/weeklyTimeRoutes');
const MonthlyTimeRoutes = require('./routes/monthlyTimeRoutes');
const memberTypeRoutes = require('./routes/memberType');
const gudianMembersRoutes = require('./routes/gudianMembers');
const membersInfoRoutes = require('./routes/membersInfo');
const memberAccessRoutes = require('./routes/memberAccess');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS middleware with specific options allowing custom headers
app.use(cors({
  origin: 'http://localhost:3000', // restrict to your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-sad-id'], // allow your custom header
}));

app.use(express.json());

// Route Middleware
app.use('/api/userLogin', userLoginRoutes);
app.use('/api/supperAdmin', supperAdminRoutes);
app.use('/api/frequencyCategory', frequencyCategoryRoutes);
app.use('/api/ikiminaInfo', ikiminaInfoRoutes);
app.use('/api/DailyTimeRoutes', DailyTimeRoutes);
app.use('/api/WeeklyTimeRoutes', WeeklyTimeRoutes);
app.use('/api/MonthlyTimeRoutes', MonthlyTimeRoutes);
app.use('/api/memberType', memberTypeRoutes);
app.use('/api/gudianMembers', gudianMembersRoutes);
app.use('/api/membersInfo', membersInfoRoutes);
app.use('/api/memberAccess', memberAccessRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
