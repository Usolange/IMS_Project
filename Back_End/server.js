const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');


const loanPredictionRoutes = require('./routes/loanPredictionRoutes');
const DailyTimeRoutes = require('./routes/dailyTimeRoutes');
const frequencyCategoryRoutes = require('./routes/frequencyCategoryRoutes');
const gudianMembersRoutes = require('./routes/gudianMembersRoutes');
const userLoginRoutes = require('./routes/userLoginRoutes');
const ScheduleManagerRoutes = require('./routes/ScheduleManagerRoutes');
const supperAdminRoutes = require('./routes/supperAdminRoutes');
const ikiminaInfoRoutes = require('./routes/ikiminaInfoRoutes');
const WeeklyTimeRoutes = require('./routes/weeklyTimeRoutes');
const MonthlyTimeRoutes = require('./routes/monthlyTimeRoutes');
const LocationManagerRoutes = require('./routes/LocationManagerRoutes');
const memberTypeRoutes = require('./routes/memberTypeRoutes');
const membersInfoRoutes = require('./routes/membersInfoRoutes');
const penalityManagementRoutes = require('./routes/penalityManagementRoutes')

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
app.use('/api/userLoginRoutes', userLoginRoutes);
app.use('/api/supperAdminRoutes', supperAdminRoutes);
app.use('/api/ScheduleManagerRoutes', ScheduleManagerRoutes);
app.use('/api/frequencyCategoryRoutes', frequencyCategoryRoutes);
app.use('/api/ikiminaInfoRoutes', ikiminaInfoRoutes);
app.use('/api/DailyTimeRoutes', DailyTimeRoutes);
app.use('/api/LocationManagerRoutes', LocationManagerRoutes);
app.use('/api/WeeklyTimeRoutes', WeeklyTimeRoutes);
app.use('/api/MonthlyTimeRoutes', MonthlyTimeRoutes);
app.use('/api/memberTypeRoutes', memberTypeRoutes);
app.use('/api/gudianMembersRoutes', gudianMembersRoutes);
app.use('/api/membersInfoRoutes', membersInfoRoutes);
app.use('/api/loanPredictionRoutes', loanPredictionRoutes);
app.use('/api/penalityManagementRoutes', penalityManagementRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
