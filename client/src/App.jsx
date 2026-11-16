import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const serverBase = apiUrl.replace('/api/v1', '');

  useEffect(() => {
    fetch(`${serverBase}/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setServerStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [serverBase]);

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: 20 }}>
      <header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 24 }}>
        <h1>Hotel Booking Platform</h1>
        <p style={{ color: '#64748b' }}>Phase 2: Project Setup & Connectivity Verification</p>
      </header>

      <main>
        <section style={{ background: '#f8fafc', padding: 24, borderRadius: 8, border: '1px solid #cbd5e1' }}>
          <h2>Backend & Database Status</h2>
          {loading && <p>Checking connection to backend and database...</p>}
          {error && (
            <div style={{ color: '#b91c1c', background: '#fee2e2', padding: 12, borderRadius: 6 }}>
              <strong>Disconnected:</strong> {error}
              <p style={{ margin: '8px 0 0 0', fontSize: '0.9em' }}>
                Make sure the backend server is running on <code>{serverBase}</code>.
              </p>
            </div>
          )}
          {serverStatus && (
            <div>
              <p style={{ color: '#15803d', fontWeight: 600 }}>Connected to Backend & Database</p>
              <ul>
                <li><strong>Service:</strong> {serverStatus.service}</li>
                <li><strong>Database:</strong> {serverStatus.database}</li>
                <li><strong>DB Time:</strong> {serverStatus.dbTime}</li>
              </ul>
            </div>
          )}
        </section>

        <section style={{ marginTop: 24 }}>
          <h3>Project Modules</h3>
          <ul>
            <li><code>/client</code>: React + Vite frontend</li>
            <li><code>/server</code>: Express.js REST API + SQLite DB</li>
            <li><code>/docs</code>: System specifications, ERD, and branching strategy</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default App;
