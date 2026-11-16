const express = require('express');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard KPI metrics
router.get('/dashboard/stats', (req, res) => {
  db.get(`SELECT COUNT(*) as total_rooms FROM rooms`, (e1, r1) => {
    db.get(`SELECT COUNT(*) as occupied_rooms FROM rooms WHERE status = 'occupied'`, (e2, r2) => {
      db.get(`SELECT COUNT(*) as total_bookings, IFNULL(SUM(total_price), 0) as total_revenue FROM bookings WHERE status != 'cancelled'`, (e3, r3) => {
        db.get(`SELECT COUNT(*) as active_guests FROM bookings WHERE status = 'checked_in'`, (e4, r4) => {
          res.json({
            stats: {
              total_rooms: r1?.total_rooms || 0,
              occupied_rooms: r2?.occupied_rooms || 0,
              occupancy_rate: r1?.total_rooms ? Math.round((r2.occupied_rooms / r1.total_rooms) * 100) : 0,
              total_bookings: r3?.total_bookings || 0,
              total_revenue: r3?.total_revenue || 0,
              active_guests: r4?.active_guests || 0
            }
          });
        });
      });
    });
  });
});

// Manage rooms
router.get('/rooms', (req, res) => {
  db.all(
    `SELECT r.*, rt.name as room_type_name, rt.base_price
     FROM rooms r
     JOIN room_types rt ON r.room_type_id = rt.id
     ORDER BY r.room_number ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ data: rows });
    }
  );
});

// Update room status
router.patch('/rooms/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['available', 'occupied', 'maintenance', 'reserved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid room status' });
  }

  db.run('UPDATE rooms SET status = ? WHERE id = ?', [status, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Room status updated', id, status });
  });
});

// Get all bookings
router.get('/bookings', (req, res) => {
  db.all(
    `SELECT b.*, u.name as guest_name, u.email as guest_email, r.room_number, rt.name as room_type_name, p.status as payment_status
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN rooms r ON b.room_id = r.id
     JOIN room_types rt ON r.room_type_id = rt.id
     LEFT JOIN payments p ON b.id = p.booking_id
     ORDER BY b.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ data: rows });
    }
  );
});

module.exports = router;
