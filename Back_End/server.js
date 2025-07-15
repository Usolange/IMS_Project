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
const ikiminaRoundRoutes = require('./routes/ikiminaRoundRoutes');
const savingManagementRoutes = require('./routes/savingManagementRoutes');
const slotsManagementRoutes = require('./routes/slotsManagementRoutes');
const penalityManagementRoutes = require('./routes/penalityManagementRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-sad-id', 'x-iki-id', 'Authorization'], // added x-iki-id and Authorization
}));

app.use(express.json());

// ✅ Route registration
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
app.use('/api/ikiminaRoundRoutes', ikiminaRoundRoutes);
app.use('/api/savingManagementRoutes', savingManagementRoutes);
app.use('/api/slotsManagementRoutes', slotsManagementRoutes);
app.use('/api/penalityManagementRoutes', penalityManagementRoutes);

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
