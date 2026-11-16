const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('./db');

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

// Basic API routes stub
app.get('/api/v1', (req, res) => {
  res.json({ message: 'Hotel Booking System API v1 is active' });
});

// Rooms discovery endpoint stub
app.get('/api/v1/rooms', (req, res) => {
  db.all('SELECT * FROM rooms LIMIT 10', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
