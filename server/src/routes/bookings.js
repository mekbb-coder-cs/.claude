const express = require('express');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// POST /api/v1/bookings - Create new booking
router.post('/', authenticateToken, (req, res) => {
  const { room_type_id, check_in, check_out } = req.body;
  const user_id = req.user.id;

  if (!room_type_id || !check_in || !check_out) {
    return res.status(400).json({ error: 'room_type_id, check_in, and check_out are required' });
  }

  // Find an available physical room for this room_type
  db.get(
    `SELECT r.id, rt.base_price FROM rooms r
     JOIN room_types rt ON r.room_type_id = rt.id
     WHERE r.room_type_id = ? AND r.status = 'available'
     AND r.id NOT IN (
       SELECT b.room_id FROM bookings b
       WHERE b.status IN ('confirmed', 'pending', 'checked_in')
       AND NOT (b.check_out <= ? OR b.check_in >= ?)
     )
     LIMIT 1`,
    [room_type_id, check_in, check_out],
    (err, availableRoom) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!availableRoom) {
        return res.status(409).json({ error: 'No rooms available for the selected dates' });
      }

      // Calculate nights and price
      const checkInDate = new Date(check_in);
      const checkOutDate = new Date(check_out);
      const nights = Math.max(1, Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
      const totalPrice = nights * availableRoom.base_price;
      const bookingId = `bk-${Date.now()}`;
      const paymentId = `pay-${Date.now()}`;
      const txRef = `TX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      db.run(
        `INSERT INTO bookings (id, user_id, room_id, check_in, check_out, total_price, status)
         VALUES (?, ?, ?, ?, ?, ?, 'confirmed')`,
        [bookingId, user_id, availableRoom.id, check_in, check_out, totalPrice],
        function (bookingErr) {
          if (bookingErr) return res.status(500).json({ error: bookingErr.message });

          // Record payment
          db.run(
            `INSERT INTO payments (id, booking_id, amount, method, status, transaction_ref, paid_at)
             VALUES (?, ?, ?, 'credit_card', 'completed', ?, datetime('now'))`,
            [paymentId, bookingId, totalPrice, txRef],
            function (payErr) {
              if (payErr) console.error('Payment record failed:', payErr);
              res.status(201).json({
                message: 'Booking confirmed successfully',
                booking: {
                  id: bookingId,
                  room_id: availableRoom.id,
                  check_in,
                  check_out,
                  total_price: totalPrice,
                  nights,
                  status: 'confirmed',
                  transaction_ref: txRef
                }
              });
            }
          );
        }
      );
    }
  );
});

// GET /api/v1/bookings/my - Get user bookings
router.get('/my', authenticateToken, (req, res) => {
  db.all(
    `SELECT b.*, rt.name as room_type_name, r.room_number, p.transaction_ref, p.status as payment_status
     FROM bookings b
     JOIN rooms r ON b.room_id = r.id
     JOIN room_types rt ON r.room_type_id = rt.id
     LEFT JOIN payments p ON b.id = p.booking_id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ data: rows });
    }
  );
});

// PATCH /api/v1/bookings/:id/cancel - Cancel booking
router.patch('/:id/cancel', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run(
    `UPDATE bookings SET status = 'cancelled', updated_at = datetime('now')
     WHERE id = ? AND (user_id = ? OR ? = 'admin')`,
    [id, req.user.id, req.user.role],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Booking not found or unauthorized' });

      // Update payment to refunded
      db.run(`UPDATE payments SET status = 'refunded' WHERE booking_id = ?`, [id]);
      res.json({ message: 'Booking cancelled and payment refunded' });
    }
  );
});

module.exports = router;
