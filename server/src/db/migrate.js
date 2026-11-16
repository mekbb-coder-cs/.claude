const db = require('./index');

const migrationSql = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    role TEXT CHECK(role IN ('guest', 'admin', 'staff')) DEFAULT 'guest',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS hotels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    rating_average REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS room_types (
    id TEXT PRIMARY KEY,
    hotel_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    base_price REAL NOT NULL,
    capacity INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(hotel_id) REFERENCES hotels(id)
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    room_number TEXT UNIQUE NOT NULL,
    room_type_id TEXT NOT NULL,
    floor INTEGER,
    status TEXT CHECK(status IN ('available', 'occupied', 'maintenance', 'reserved')) DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_type_id) REFERENCES room_types(id)
  );

  CREATE TABLE IF NOT EXISTS amenities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon_name TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS room_type_amenities (
    room_type_id TEXT,
    amenity_id TEXT,
    PRIMARY KEY(room_type_id, amenity_id),
    FOREIGN KEY(room_type_id) REFERENCES room_types(id),
    FOREIGN KEY(amenity_id) REFERENCES amenities(id)
  );

  CREATE TABLE IF NOT EXISTS room_images (
    id TEXT PRIMARY KEY,
    room_type_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_primary INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY(room_type_id) REFERENCES room_types(id)
  );

  CREATE TABLE IF NOT EXISTS seasonal_prices (
    id TEXT PRIMARY KEY,
    room_type_id TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_multiplier REAL DEFAULT 1.0,
    FOREIGN KEY(room_type_id) REFERENCES room_types(id)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_price REAL NOT NULL,
    status TEXT CHECK(status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(room_id) REFERENCES rooms(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    method TEXT CHECK(method IN ('credit_card', 'paypal', 'stripe', 'bank_transfer')),
    status TEXT CHECK(status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    transaction_ref TEXT UNIQUE NOT NULL,
    paid_at DATETIME,
    FOREIGN KEY(booking_id) REFERENCES bookings(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    room_type_id TEXT NOT NULL,
    booking_id TEXT UNIQUE,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(room_type_id) REFERENCES room_types(id),
    FOREIGN KEY(booking_id) REFERENCES bookings(id)
  );
`;

console.log('Running database migration...');

db.exec(migrationSql, (err) => {
  if (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
  console.log('Database migration completed successfully! All core tables created.');
  db.close();
});
