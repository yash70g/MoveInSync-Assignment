import { useState, useEffect } from 'react';
import { getAnalytics, getRegionAdoption, getDeviceTimeline } from '../services/adminApi';
import { getAllDevices } from '../services/api';

function Analytics() {
  const [stats, setStats] = useState(null);
  const [regionData, setRegionData] = useState({});
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    fetchAnalytics();
    fetchRegionData();
    fetchDevices();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await getAnalytics();
      if (response.success) setStats(response.data);
    } catch (error) {}
  };

  const fetchRegionData = async () => {
    try {
      const response = await getRegionAdoption();
      if (response.success) setRegionData(response.data);
    } catch (error) {}
  };

  const fetchDevices = async () => {
    try {
      const response = await getAllDevices();
      if (response.success) setDevices(response.data);
    } catch (error) {}
  };

  const handleDeviceSelect = async (imei) => {
    setSelectedDevice(imei);
    try {
      const response = await getDeviceTimeline(imei);
      if (response.success) setTimeline(response.data);
    } catch (error) {
      setTimeline([]);
    }
  };

  return (
    <div>
      <h2>Analytics Dashboard</h2>

      {stats && (
        <div>
          <h3>Update Rollout Progress</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
              <div>Total Devices</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalDevices}</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
              <div>Completed</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4caf50' }}>{stats.completedDevices}</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
              <div>Pending</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff9800' }}>{stats.pendingDevices}</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
              <div>Failed</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f44336' }}>{stats.failedDevices}</div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h4>Progress: {stats.progress}%</h4>
            <div style={{ width: '100%', background: '#e0e0e0', height: '30px', borderRadius: '4px' }}>
              <div style={{ width: `${stats.progress}%`, background: '#4caf50', height: '100%', borderRadius: '4px', transition: 'width 0.3s' }}></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
              <div>Success Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4caf50' }}>{stats.successRate}%</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
              <div>Failure Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f44336' }}>{stats.failureRate}%</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h3>Region-wise Version Heatmap</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '0.75rem', border: '1px solid #ccc', textAlign: 'left' }}>Region</th>
              <th style={{ padding: '0.75rem', border: '1px solid #ccc', textAlign: 'left' }}>Version Distribution</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(regionData).map(([region, versions]) => (
              <tr key={region}>
                <td style={{ padding: '0.75rem', border: '1px solid #ccc' }}><strong>{region}</strong></td>
                <td style={{ padding: '0.75rem', border: '1px solid #ccc' }}>
                  {Object.entries(versions).map(([version, count]) => (
                    <span key={version} style={{ marginRight: '1rem', padding: '0.25rem 0.5rem', background: '#e3f2fd', borderRadius: '4px' }}>
                      {version}: {count} devices
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3>Device Update Timeline</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label>Select Device: </label>
          <select value={selectedDevice} onChange={(e) => handleDeviceSelect(e.target.value)} style={{ padding: '0.5rem', marginLeft: '0.5rem' }}>
            <option value="">-- Select Device --</option>
            {devices.map(device => (
              <option key={device.imei} value={device.imei}>
                {device.imei} - {device.region} - {device.currentVersion}
              </option>
            ))}
          </select>
        </div>

        {timeline.length > 0 && (
          <div>
            {timeline.map((history, idx) => (
              <div key={idx} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Update: {history.oldVersion} to {history.newVersion}
                  <span style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', background: history.status === 'installation_completed' ? '#e8f5e9' : history.status === 'failed' ? '#ffebee' : '#fff3e0', borderRadius: '4px' }}>
                    {history.status}
                  </span>
                </div>
                {history.failureReason && (
                  <div style={{ color: '#f44336', marginBottom: '0.5rem' }}>
                    Failure: {history.failureReason}
                  </div>
                )}
                <div style={{ marginTop: '1rem' }}>
                  <h4>Timeline:</h4>
                  {history.timeline.map((event, eventIdx) => (
                    <div key={eventIdx} style={{ padding: '0.5rem', borderLeft: '2px solid #2196f3', marginLeft: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 'bold' }}>
                        [{new Date(event.timestamp).toLocaleTimeString()}] {event.event}
                      </div>
                      {event.details && <div style={{ color: '#666', fontSize: '0.9rem' }}>{event.details}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedDevice && timeline.length === 0 && (
          <p>No update history found for this device</p>
        )}
      </div>
    </div>
  );
}

export default Analytics;
