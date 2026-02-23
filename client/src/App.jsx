import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { sendHeartbeat } from './services/api';
import { getDeviceInfo } from './utils/deviceUtils';
import AdminDashboard from './components/AdminDashboard';
import VersionManagement from './components/VersionManagement';

function ClientView() {
  const [status, setStatus] = useState('Initializing...');
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [heartbeatCount, setHeartbeatCount] = useState(0);

  useEffect(() => {
    const sendInitialHeartbeat = async () => {
      try {
        setStatus('Sending heartbeat...');
        const info = getDeviceInfo();
        setDeviceInfo(info);
        const response = await sendHeartbeat(info);
        if (response.success) {
          setStatus(response.message);
          setHeartbeatCount(prev => prev + 1);
        }
      } catch (error) {
        setStatus('Failed to send heartbeat. Is the server running?');
      }
    };
    sendInitialHeartbeat();
  }, []);

  return (
    <div className="app">
      <div className="container">
        <h1>Mobile Device Management</h1>
        <div className="card">
          <h2>Client Application</h2>
          <div className="status">
            <strong>Status:</strong> {status}
          </div>
          <div className="heartbeat-count">
            <strong>Heartbeats Sent:</strong> {heartbeatCount}
          </div>

          {deviceInfo && (
            <div className="device-info">
              <h3>Device Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">IMEI:</span>
                  <span className="value">{deviceInfo.imei}</span>
                </div>
                <div className="info-item">
                  <span className="label">Region:</span>
                  <span className="value">{deviceInfo.region}</span>
                </div>
                <div className="info-item">
                  <span className="label">Version:</span>
                  <span className="value">{deviceInfo.currentVersion}</span>
                </div>
                <div className="info-item">
                  <span className="label">Last Heartbeat:</span>
                  <span className="value">{new Date(deviceInfo.lastHeartbeat).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="info-box">
          <p><strong>Note:</strong> Refresh to send another heartbeat.</p>
          <Link to="/admin/versions" className="admin-link">Go to Admin Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ClientView />} />
        <Route path="/admin" element={<AdminDashboard />}>
          <Route path="versions" element={<VersionManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
