import { useState, useEffect } from 'react';
import { getAllVersions } from '../services/adminApi';
import { getAllDevices } from '../services/api';
import { createLiveUpdate, getFilteredDevices } from '../services/adminApi';

function PushUpdate() {
  const [versions, setVersions] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterVersion, setFilterVersion] = useState('all');
  const [selectedOldVersion, setSelectedOldVersion] = useState('');
  const [selectedNewVersion, setSelectedNewVersion] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    fetchVersions();
    fetchDevices();
  }, []);

  useEffect(() => {
    fetchFilteredDevices();
  }, [filterRegion, filterVersion]);

  const fetchVersions = async () => {
    try {
      const response = await getAllVersions();
      if (response.success) setVersions(response.data);
    } catch (error) {}
  };

  const fetchDevices = async () => {
    try {
      const response = await getAllDevices();
      if (response.success) {
        setDevices(response.data);
        const uniqueRegions = [...new Set(response.data.map(d => d.region))];
        setRegions(uniqueRegions);
      }
    } catch (error) {}
  };

  const fetchFilteredDevices = async () => {
    try {
      const response = await getFilteredDevices(filterRegion, filterVersion);
      if (response.success) setDevices(response.data);
    } catch (error) {}
  };

  const handleDeviceSelect = (imei) => {
    setSelectedDevices(prev => 
      prev.includes(imei) ? prev.filter(id => id !== imei) : [...prev, imei]
    );
  };

  const handleSelectAll = () => {
    if (selectedDevices.length === devices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(devices.map(d => d.imei));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDevices.length === 0) {
      setMessage('Please select at least one device');
      return;
    }
    if (!selectedOldVersion || !selectedNewVersion) {
      setMessage('Please select both old and new versions');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await createLiveUpdate({
        region: filterRegion === 'all' ? null : filterRegion,
        oldVersion: selectedOldVersion,
        newVersion: selectedNewVersion,
        deviceIds: selectedDevices
      });

      if (response.success) {
        setMessage(`Update created for ${selectedDevices.length} devices!`);
        setSelectedDevices([]);
        setSelectedOldVersion('');
        setSelectedNewVersion('');
      }
    } catch (error) {
      setMessage('Failed to create update. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Push Updates to Devices</h2>
      <p>Filter and select devices, then push version updates</p>

      <div>
        <h3>Filter Devices</h3>
        <div>
          <label>Region:</label>
          <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
            <option value="all">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <label>Version:</label>
          <select value={filterVersion} onChange={(e) => setFilterVersion(e.target.value)}>
            <option value="all">All Versions</option>
            {versions.map(version => (
              <option key={version._id} value={version.versionString}>{version.versionString}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3>Select Devices ({selectedDevices.length} selected)</h3>
        <button onClick={handleSelectAll}>
          {selectedDevices.length === devices.length ? 'Deselect All' : 'Select All'}
        </button>
        
        {devices.length === 0 ? (
          <p>No devices found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Select</th>
                <th>IMEI</th>
                <th>Region</th>
                <th>Current Version</th>
                <th>Last Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(device => (
                <tr key={device.imei}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(device.imei)}
                      onChange={() => handleDeviceSelect(device.imei)}
                    />
                  </td>
                  <td>{device.imei}</td>
                  <td>{device.region}</td>
                  <td>{device.currentVersion}</td>
                  <td>{new Date(device.lastHeartbeat).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <h3>Select Version Update</h3>
        <div>
          <label>From Version:</label>
          <select value={selectedOldVersion} onChange={(e) => setSelectedOldVersion(e.target.value)} required>
            <option value="">Select old version</option>
            {versions.map(version => (
              <option key={version._id} value={version.versionString}>{version.versionString} (Code: {version.versionCode})</option>
            ))}
          </select>

          <label>To Version:</label>
          <select value={selectedNewVersion} onChange={(e) => setSelectedNewVersion(e.target.value)} required>
            <option value="">Select new version</option>
            {versions.map(version => (
              <option key={version._id} value={version.versionString}>{version.versionString} (Code: {version.versionCode})</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading || selectedDevices.length === 0}>
          {loading ? 'Creating...' : 'Push Update'}
        </button>
      </form>

      {message && (
        <div style={{ marginTop: '1rem', padding: '1rem' }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default PushUpdate;
