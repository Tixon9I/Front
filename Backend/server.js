const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const subscriberRoutes = require('./routes/subscribers');
const bookingRoutes = require('./routes/bookings');
const scheduleRoutes = require('./routes/schedule');
const clientRoutes = require('./routes/client-routes');
const adminRoutes = require('./routes/admin-routes');
const cron = require('./routes/cron');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://127.0.0.1:5500',
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', subscriberRoutes);
app.use('/api', bookingRoutes);
app.use('/api', scheduleRoutes);
app.use('/api', clientRoutes);
app.use('/api/admin', adminRoutes);

// Запускаємо CRON-завдання
cron.start();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});