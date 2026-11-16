import { useState, useEffect } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'my-bookings', 'admin', 'auth'
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  // Search filters
  const [checkIn, setCheckIn] = useState('2026-11-20');
  const [checkOut, setCheckOut] = useState('2026-11-24');
  const [guests, setGuests] = useState('2');
  const [searchFeedback, setSearchFeedback] = useState('');

  // Bookings state
  const [myBookings, setMyBookings] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminRooms, setAdminRooms] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);

  // Auth form
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = (query = '') => {
    fetch(`${API_BASE}/room-types${query}`)
      .then((r) => r.json())
      .then((d) => setRoomTypes(d.data || []))
      .catch((err) => console.error(err));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = `?capacity=${guests}&checkIn=${checkIn}&checkOut=${checkOut}`;
    fetchRoomTypes(query);
    setSearchFeedback(`Showing available rooms for ${guests} guest(s) from ${checkIn} to ${checkOut}`);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    const payload = authMode === 'login'
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword };

    fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.error) {
          setAuthError(res.error);
        } else {
          setUser(res.user);
          setToken(res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('token', res.token);
          setCurrentView('home');
        }
      })
      .catch((err) => setAuthError(err.message));
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentView('home');
  };

  const handleBookRoom = (roomType) => {
    if (!token) {
      setCurrentView('auth');
      return;
    }

    fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        room_type_id: roomType.id,
        check_in: checkIn,
        check_out: checkOut
      })
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.error) {
          alert(`Booking error: ${res.error}`);
        } else {
          alert(`Booking Confirmed! Reference: ${res.booking.transaction_ref} (Total: $${res.booking.total_price})`);
          setSelectedRoom(null);
          loadMyBookings();
          setCurrentView('my-bookings');
        }
      });
  };

  const loadMyBookings = () => {
    if (!token) return;
    fetch(`${API_BASE}/bookings/my`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => setMyBookings(d.data || []));
  };

  const handleCancelBooking = (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then(() => loadMyBookings());
  };

  const loadAdminData = () => {
    if (!token) return;
    fetch(`${API_BASE}/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => setAdminStats(d.stats));

    fetch(`${API_BASE}/admin/rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => setAdminRooms(d.data || []));

    fetch(`${API_BASE}/admin/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => setAdminBookings(d.data || []));
  };

  const updateRoomStatus = (roomId, newStatus) => {
    fetch(`${API_BASE}/admin/rooms/${roomId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then((r) => r.json())
      .then(() => loadAdminData());
  };

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container nav-inner">
          <div className="brand" onClick={() => setCurrentView('home')}>
            🏨 <span className="brand-accent">Hotel</span>Ease
          </div>
          <div className="nav-links">
            <button
              className={`nav-btn ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentView('home')}
            >
              Discover Rooms
            </button>
            {user && (
              <button
                className={`nav-btn ${currentView === 'my-bookings' ? 'active' : ''}`}
                onClick={() => {
                  loadMyBookings();
                  setCurrentView('my-bookings');
                }}
              >
                My Bookings
              </button>
            )}
            {user && user.role === 'admin' && (
              <button
                className={`nav-btn ${currentView === 'admin' ? 'active' : ''}`}
                onClick={() => {
                  loadAdminData();
                  setCurrentView('admin');
                }}
              >
                Admin Console
              </button>
            )}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                  Hi, <strong>{user.name}</strong> ({user.role})
                </span>
                <button className="nav-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <button className="primary-btn" onClick={() => setCurrentView('auth')}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main View Switcher */}
      {currentView === 'home' && (
        <div>
          <section className="hero">
            <div className="container">
              <h1>Escape to Comfort & Luxury</h1>
              <p>Book premium suites, private villas, and serene beachside getaways.</p>
              <form className="search-widget" onSubmit={handleSearch}>
                <div className="input-group">
                  <label>Check-In</label>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Check-Out</label>
                  <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Guests</label>
                  <select value={guests} onChange={(e) => setGuests(e.target.value)}>
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="4">4+ Guests</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="primary-btn" style={{ height: 42, width: '100%' }}>
                    Search Stays
                  </button>
                </div>
              </form>
            </div>
          </section>

          <main className="container">
            {searchFeedback && (
              <p style={{ marginTop: 20, color: '#2563eb', fontWeight: 500 }}>
                {searchFeedback}
              </p>
            )}
            <div className="rooms-grid">
              {roomTypes.map((rt) => (
                <div key={rt.id} className="room-card">
                  <img src={rt.primary_image} alt={rt.name} />
                  <div className="room-card-content">
                    <div className="room-header">
                      <div className="room-title">{rt.name}</div>
                      <div className="room-price">
                        ${rt.base_price}
                        <span>/nt</span>
                      </div>
                    </div>
                    <p className="room-desc">{rt.description}</p>
                    <div className="amenities-badges">
                      <span className="badge">Max: {rt.capacity} Guests</span>
                      {rt.amenities.map((a, i) => (
                        <span key={i} className="badge">
                          {a}
                        </span>
                      ))}
                    </div>
                    <button
                      className="primary-btn"
                      style={{ marginTop: 'auto' }}
                      onClick={() => handleBookRoom(rt)}
                    >
                      {token ? 'Book Instant Stay' : 'Sign in to Reserve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      )}

      {/* My Bookings View */}
      {currentView === 'my-bookings' && (
        <div className="container" style={{ margin: '40px auto' }}>
          <h2>My Reservations</h2>
          {myBookings.length === 0 ? (
            <p style={{ marginTop: 16, color: '#64748b' }}>No bookings found yet. Explore our rooms to make a reservation!</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Room Type</th>
                  <th>Room #</th>
                  <th>Dates</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b) => (
                  <tr key={b.id}>
                    <td><code>{b.id}</code></td>
                    <td><strong>{b.room_type_name}</strong></td>
                    <td>Unit {b.room_number}</td>
                    <td>{b.check_in} &rarr; {b.check_out}</td>
                    <td>${b.total_price}</td>
                    <td>
                      <span className={`status-pill status-${b.status}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      {b.status !== 'cancelled' && (
                        <button
                          style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: 4,
                            cursor: 'pointer'
                          }}
                          onClick={() => handleCancelBooking(b.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Admin View */}
      {currentView === 'admin' && (
        <div className="container" style={{ margin: '40px auto' }}>
          <h2>Hotel Operations & Admin Console</h2>

          {adminStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '24px 0' }}>
              <div style={{ background: '#ffffff', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>OCCUPANCY RATE</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }}>{adminStats.occupancy_rate}%</div>
                <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>{adminStats.occupied_rooms} of {adminStats.total_rooms} rooms</div>
              </div>
              <div style={{ background: '#ffffff', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>TOTAL REVENUE</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2563eb' }}>${adminStats.total_revenue}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>From {adminStats.total_bookings} bookings</div>
              </div>
              <div style={{ background: '#ffffff', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>ACTIVE GUESTS</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }}>{adminStats.active_guests}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Currently on property</div>
              </div>
            </div>
          )}

          <h3 style={{ marginTop: 32 }}>Physical Rooms Inventory</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Room #</th>
                <th>Type</th>
                <th>Floor</th>
                <th>Status</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {adminRooms.map((r) => (
                <tr key={r.id}>
                  <td><strong>Room {r.room_number}</strong></td>
                  <td>{r.room_type_name}</td>
                  <td>Floor {r.floor}</td>
                  <td>
                    <span className={`status-pill status-${r.status}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={r.status}
                      onChange={(e) => updateRoomStatus(r.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="reserved">Reserved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 32 }}>Recent Guest Reservations</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Stay Dates</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {adminBookings.map((b) => (
                <tr key={b.id}>
                  <td><code>{b.id}</code></td>
                  <td>{b.guest_name} ({b.guest_email})</td>
                  <td>Unit {b.room_number} - {b.room_type_name}</td>
                  <td>{b.check_in} to {b.check_out}</td>
                  <td>${b.total_price}</td>
                  <td>
                    <span className={`status-pill status-${b.status}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Auth View */}
      {currentView === 'auth' && (
        <div className="container" style={{ maxWidth: 440, margin: '60px auto' }}>
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: 8, textAlign: 'center' }}>
              {authMode === 'login' ? 'Sign In to HotelEase' : 'Create an Account'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', marginBottom: 24 }}>
              Demo accounts: <code>admin@hotelease.com</code> (pw: <code>Admin123!</code>) or <code>john@example.com</code> (pw: <code>Password123!</code>)
            </p>

            {authError && (
              <div style={{ color: '#b91c1c', background: '#fee2e2', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: '0.9rem' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {authMode === 'register' && (
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
              <button type="submit" className="primary-btn" style={{ marginTop: 8 }}>
                {authMode === 'login' ? 'Sign In' : 'Register Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem' }}
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                }}
              >
                {authMode === 'login'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Log in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
