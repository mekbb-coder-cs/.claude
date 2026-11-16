const db = require('./index');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Seeding initial data...');

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);

  // Clean existing seed data
  await new Promise((res) => db.run('DELETE FROM reviews', res));
  await new Promise((res) => db.run('DELETE FROM payments', res));
  await new Promise((res) => db.run('DELETE FROM bookings', res));
  await new Promise((res) => db.run('DELETE FROM seasonal_prices', res));
  await new Promise((res) => db.run('DELETE FROM room_images', res));
  await new Promise((res) => db.run('DELETE FROM room_type_amenities', res));
  await new Promise((res) => db.run('DELETE FROM amenities', res));
  await new Promise((res) => db.run('DELETE FROM rooms', res));
  await new Promise((res) => db.run('DELETE FROM room_types', res));
  await new Promise((res) => db.run('DELETE FROM hotels', res));
  await new Promise((res) => db.run('DELETE FROM users', res));

  // Users
  const users = [
    { id: 'usr-admin-1', name: 'Admin Manager', email: 'admin@hotelease.com', password_hash: adminPasswordHash, role: 'admin' },
    { id: 'usr-guest-1', name: 'John Doe', email: 'john@example.com', password_hash: passwordHash, role: 'guest' },
    { id: 'usr-guest-2', name: 'Jane Smith', email: 'jane@example.com', password_hash: passwordHash, role: 'guest' }
  ];

  for (const u of users) {
    await new Promise((res, rej) => {
      db.run('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [u.id, u.name, u.email, u.password_hash, u.role], (err) => err ? rej(err) : res());
    });
  }

  // Hotel
  const hotelId = 'htl-grand-1';
  await new Promise((res, rej) => {
    db.run(`INSERT INTO hotels (id, name, description, address, city, country, rating_average)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [hotelId, 'Grand Horizon Resort & Spa', 'A luxury 5-star beachfront retreat offering panoramic ocean views and world-class dining.', '100 Ocean Drive', 'Miami Beach', 'USA', 4.9],
      (err) => err ? rej(err) : res());
  });

  // Amenities
  const amenities = [
    { id: 'amn-1', name: 'High-speed WiFi', icon_name: 'wifi', category: 'General' },
    { id: 'amn-2', name: 'Infinity Pool Access', icon_name: 'pool', category: 'Leisure' },
    { id: 'amn-3', name: 'King Size Bed', icon_name: 'bed', category: 'Room' },
    { id: 'amn-4', name: 'Complimentary Breakfast', icon_name: 'coffee', category: 'Dining' },
    { id: 'amn-5', name: 'Spa & Jacuzzi', icon_name: 'spa', category: 'Wellness' },
    { id: 'amn-6', name: 'Ocean View Balcony', icon_name: 'sunset', category: 'Room' }
  ];

  for (const a of amenities) {
    await new Promise((res, rej) => {
      db.run('INSERT INTO amenities (id, name, icon_name, category) VALUES (?, ?, ?, ?)',
        [a.id, a.name, a.icon_name, a.category], (err) => err ? rej(err) : res());
    });
  }

  // Room Types
  const roomTypes = [
    {
      id: 'rt-deluxe-king',
      hotel_id: hotelId,
      name: 'Deluxe King Suite',
      description: 'Spacious 42 sqm suite with panoramic coastline views, private terrace, and Italian marble bathroom.',
      base_price: 240,
      capacity: 2,
      amenityIds: ['amn-1', 'amn-3', 'amn-4', 'amn-6'],
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      id: 'rt-ocean-penthouse',
      hotel_id: hotelId,
      name: 'Oceanfront Penthouse',
      description: 'Ultra-luxurious top-floor penthouse with private heated plunge pool, dedicated concierge, and sunset views.',
      base_price: 490,
      capacity: 4,
      amenityIds: ['amn-1', 'amn-2', 'amn-3', 'amn-4', 'amn-5', 'amn-6'],
      images: [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      id: 'rt-cozy-queen',
      hotel_id: hotelId,
      name: 'Superior Queen Room',
      description: 'Elegant contemporary room featuring plush queen bedding, ergonomic work station, and city garden view.',
      base_price: 150,
      capacity: 2,
      amenityIds: ['amn-1', 'amn-3', 'amn-4'],
      images: [
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80'
      ]
    }
  ];

  for (const rt of roomTypes) {
    await new Promise((res, rej) => {
      db.run('INSERT INTO room_types (id, hotel_id, name, description, base_price, capacity) VALUES (?, ?, ?, ?, ?, ?)',
        [rt.id, rt.hotel_id, rt.name, rt.description, rt.base_price, rt.capacity], (err) => err ? rej(err) : res());
    });

    for (const aId of rt.amenityIds) {
      await new Promise((res, rej) => {
        db.run('INSERT INTO room_type_amenities (room_type_id, amenity_id) VALUES (?, ?)',
          [rt.id, aId], (err) => err ? rej(err) : res());
      });
    }

    for (let i = 0; i < rt.images.length; i++) {
      await new Promise((res, rej) => {
        db.run('INSERT INTO room_images (id, room_type_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?, ?)',
          [`img-${rt.id}-${i}`, rt.id, rt.images[i], i === 0 ? 1 : 0, i], (err) => err ? rej(err) : res());
      });
    }
  }

  // Physical Rooms
  const rooms = [
    { id: 'rm-101', room_number: '101', room_type_id: 'rt-deluxe-king', floor: 1, status: 'available' },
    { id: 'rm-102', room_number: '102', room_type_id: 'rt-deluxe-king', floor: 1, status: 'available' },
    { id: 'rm-201', room_number: '201', room_type_id: 'rt-cozy-queen', floor: 2, status: 'available' },
    { id: 'rm-202', room_number: '202', room_type_id: 'rt-cozy-queen', floor: 2, status: 'available' },
    { id: 'rm-501', room_number: '501', room_type_id: 'rt-ocean-penthouse', floor: 5, status: 'available' }
  ];

  for (const r of rooms) {
    await new Promise((res, rej) => {
      db.run('INSERT INTO rooms (id, room_number, room_type_id, floor, status) VALUES (?, ?, ?, ?, ?)',
        [r.id, r.room_number, r.room_type_id, r.floor, r.status], (err) => err ? rej(err) : res());
    });
  }

  // Initial Reviews
  const reviews = [
    {
      id: 'rev-1',
      user_id: 'usr-guest-1',
      room_type_id: 'rt-deluxe-king',
      rating: 5,
      comment: 'Breathtaking ocean view and the bed was heavenly! Exceptional service from check-in to checkout.'
    },
    {
      id: 'rev-2',
      user_id: 'usr-guest-2',
      room_type_id: 'rt-deluxe-king',
      rating: 5,
      comment: 'Loved the balcony breakfast. Very clean and modern amenities.'
    }
  ];

  for (const rev of reviews) {
    await new Promise((res, rej) => {
      db.run('INSERT INTO reviews (id, user_id, room_type_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [rev.id, rev.user_id, rev.room_type_id, rev.rating, rev.comment], (err) => err ? rej(err) : res());
    });
  }

  console.log('Seeding completed successfully!');
  db.close();
}

seed().catch(console.error);
