import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { sendHeartbeat } from './services/api';
import { getDeviceInfo, updateDeviceVersion } from './utils/deviceUtils';
import { rejectUpdate } from './services/api';
import { io } from 'socket.io-client';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import VersionManagement from './components/VersionManagement';
import PushUpdate from './components/PushUpdate';
import LiveUpdatesList from './components/LiveUpdatesList';
import './App.css';
import Analytics from './components/Analytics';

function ClientView() {
  const [status, setStatus] = useState('Initializing...');
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [heartbeatCount, setHeartbeatCount] = useState(0);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStep, setUpdateStep] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setStatus('Sending heartbeat...');
        const info = getDeviceInfo();
        setDeviceInfo(info);
        const response = await sendHeartbeat(info);
        if (response.success) {
          setStatus(response.message);
          setHeartbeatCount(prev => prev + 1);
          if (response.updateAvailable) {
            setUpdateInfo(response.updateInfo);
            setShowUpdatePrompt(true);
          }
        }
      } catch (error) {
        setStatus('Failed to send heartbeat. Is the server running?');
      }
    })();
  }, []);

  const handleAcceptUpdate = () => {
    setShowUpdatePrompt(false);
    setUpdating(true);
    setStatus('Starting update...');
    
    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      socket.emit('start-update', {
        imei: deviceInfo.imei,
        updateId: updateInfo.updateId
      });
    });

    socket.on('update-progress', (data) => {
      setUpdateProgress(data.progress);
      setUpdateStep(`Installing version ${data.currentVersion} (${data.step}/${data.totalSteps})`);
      setStatus(`Updating... ${data.progress}%`);
    });

    socket.on('update-complete', (data) => {
      setStatus('Update completed successfully!');
      setUpdating(false);
      updateDeviceVersion(data.newVersion);
      setDeviceInfo(prev => ({ ...prev, currentVersion: data.newVersion }));
      socket.disconnect();
      setUpdateProgress(0);
      setUpdateStep('');
    });

    socket.on('update-error', (data) => {
      setStatus('Update failed: ' + data.message);
      setUpdating(false);
      socket.disconnect();
      setUpdateProgress(0);
      setUpdateStep('');
    });
  };

  const handleRejectUpdate = async () => {
    try {
      await rejectUpdate(deviceInfo.imei, updateInfo.updateId);
      setShowUpdatePrompt(false);
      setStatus('Update rejected');
      setUpdateInfo(null);
    } catch {
      setStatus('Failed to reject update');
    }
  };

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

          {updating && (
            <div style={{ margin: '1rem 0', padding: '1rem', background: '#e3f2fd', border: '1px solid #2196f3' }}>
              <h3>Update in Progress</h3>
              <div>{updateStep}</div>
              <div style={{ marginTop: '0.5rem', background: '#fff', height: '20px', border: '1px solid #ccc' }}>
                <div style={{ width: `${updateProgress}%`, height: '100%', background: '#2196f3', transition: 'width 0.3s' }}></div>
              </div>
              <div style={{ marginTop: '0.5rem' }}>{updateProgress}% Complete</div>
            </div>
          )}

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

        {showUpdatePrompt && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '500px', width: '90%' }}>
              <h2>Update Available</h2>
              <p>A new version is available for your device.</p>
              <div style={{ margin: '1rem 0' }}>
                <div><strong>Current Version:</strong> {updateInfo?.oldVersion}</div>
                <div><strong>New Version:</strong> {updateInfo?.newVersion}</div>
                <div><strong>Update Path:</strong> {updateInfo?.hierarchyOrder.join(', ')}</div>
              </div>
              <p>Would you like to update now? This will take approximately 5 seconds.</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  onClick={handleAcceptUpdate}
                  style={{ flex: 1, padding: '0.5rem', background: 'white', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Accept
                </button>
                <button 
                  onClick={handleRejectUpdate}
                  style={{ flex: 1, padding: '0.5rem', background: 'white', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="info-box">
          <p><strong>Note:</strong> Refresh to send another heartbeat.</p>
          {localStorage.getItem('user') ? (
            <>
              <Link to="/admin/versions" className="admin-link">Go to Admin Dashboard</Link>
              <button onClick={() => { localStorage.removeItem('user'); window.location.href = '/login'; }} style={{ marginLeft: '10px', padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
            </>
          ) : <Link to="/login" className="admin-link">Login</Link>}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ClientView />} />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        }>
          <Route path="versions" element={<VersionManagement />} />
          <Route path="push-update" element={<PushUpdate />} />
          <Route path="active-updates" element={<LiveUpdatesList />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
