const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('./db');

const authRoutes = require('./routes/auth');
const roomTypeRoutes = require('./routes/roomTypes');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Health & DB Connection check endpoint
app.get('/health', (req, res) => {
  db.get('SELECT datetime("now") as currentTime', (err, row) => {
    if (err) {
      return res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
    }
    res.json({
      status: 'ok',
      service: 'hotel-booking-server',
      database: 'connected',
      dbTime: row.currentTime,
      timestamp: new Date().toISOString()
    });
  });
});

// Mount modular REST API endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/room-types', roomTypeRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Hotel Booking System API v1 is active',
    endpoints: [
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/api/v1/auth/me',
      '/api/v1/room-types',
      '/api/v1/room-types/:id',
      '/api/v1/bookings',
      '/api/v1/bookings/my',
      '/api/v1/admin/dashboard/stats',
      '/api/v1/admin/rooms',
      '/api/v1/admin/bookings'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
