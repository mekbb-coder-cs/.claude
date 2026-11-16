const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/v1/room-types
router.get('/', (req, res) => {
  const { minPrice, maxPrice, capacity, checkIn, checkOut } = req.query;

  let sql = `
    SELECT rt.*,
      GROUP_CONCAT(DISTINCT a.name) as amenities_list,
      (SELECT image_url FROM room_images WHERE room_type_id = rt.id ORDER BY is_primary DESC, display_order ASC LIMIT 1) as primary_image,
      (SELECT COUNT(*) FROM rooms WHERE room_type_id = rt.id AND status = 'available') as available_rooms_count
    FROM room_types rt
    LEFT JOIN room_type_amenities rta ON rt.id = rta.room_type_id
    LEFT JOIN amenities a ON rta.amenity_id = a.id
    WHERE 1=1
  `;
  const params = [];

  if (minPrice) {
    sql += ' AND rt.base_price >= ?';
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    sql += ' AND rt.base_price <= ?';
    params.push(Number(maxPrice));
  }
  if (capacity) {
    sql += ' AND rt.capacity >= ?';
    params.push(Number(capacity));
  }

  sql += ' GROUP BY rt.id ORDER BY rt.base_price ASC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const formatted = rows.map((r) => ({
      ...r,
      amenities: r.amenities_list ? r.amenities_list.split(',') : [],
      primary_image: r.primary_image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
    }));

    res.json({ data: formatted });
  });
});

// GET /api/v1/room-types/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM room_types WHERE id = ?', [id], (err, roomType) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!roomType) return res.status(404).json({ error: 'Room type not found' });

    // Fetch images
    db.all('SELECT image_url, is_primary FROM room_images WHERE room_type_id = ? ORDER BY display_order ASC', [id], (err, images) => {
      // Fetch amenities
      db.all(`
        SELECT a.id, a.name, a.icon_name, a.category
        FROM amenities a
        JOIN room_type_amenities rta ON a.id = rta.amenity_id
        WHERE rta.room_type_id = ?
      `, [id], (err, amenities) => {
        // Fetch reviews
        db.all(`
          SELECT r.*, u.name as reviewer_name
          FROM reviews r
          JOIN users u ON r.user_id = u.id
          WHERE r.room_type_id = ?
          ORDER BY r.created_at DESC
        `, [id], (err, reviews) => {
          res.json({
            data: {
              ...roomType,
              images: images.length ? images.map(i => i.image_url) : ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'],
              amenities: amenities || [],
              reviews: reviews || []
            }
          });
        });
      });
    });
  });
});

module.exports = router;
