import { useState, useEffect } from 'react';
import { registerVersion, getAllVersions, deleteVersion } from '../services/adminApi';

function VersionManagement() {
  const [versions, setVersions] = useState([]);
  const [versionString, setVersionString] = useState('');
  const [versionCode, setVersionCode] = useState('');
  const [checksum, setChecksum] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const response = await getAllVersions();
      if (response.success) setVersions(response.data);
    } catch (error) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await registerVersion({
        versionString,
        versionCode: parseInt(versionCode),
        checksum
      });

      if (response.success) {
        setMessage('Version registered successfully!');
        setVersionString('');
        setVersionCode('');
        setChecksum('');
        fetchVersions();
      }
    } catch (error) {
      setMessage('Failed to register version. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (versionId) => {
    if (!window.confirm('Delete this version?')) return;
    try {
      await deleteVersion(versionId);
      setMessage('Version deleted successfully!');
      fetchVersions();
    } catch (error) {
      setMessage('Failed to delete version.');
    }
  };

  return (
    <div className="version-management">
      <h2>Version Management</h2>
      <p className="description">Register versions with hierarchy (0,1,2,3). Updates must pass through intermediate versions.</p>
      
      <div className="register-form">
        <h3>Register New Version</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Version String:</label>
            <input
              type="text"
              value={versionString}
              onChange={(e) => setVersionString(e.target.value)}
              placeholder="e.g., 1.0.0"
              required
            />
            <small>Semantic version format (e.g., 0.0.0, 1.0.0, 2.0.0)</small>
          </div>
          
          <div className="form-group">
            <label>Version Code:</label>
            <input
              type="number"
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
              placeholder="e.g., 1"
              min="0"
              required
            />
            <small>Integer for hierarchy (0, 1, 2, 3...)</small>
          </div>
          
          <div className="form-group">
            <label>Checksum (Mock):</label>
            <input
              type="text"
              value={checksum}
              onChange={(e) => setChecksum(e.target.value)}
              placeholder="e.g., abc123xyz"
              required
            />
            <small>Mock string for update validation</small>
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Registering...' : 'Register Version'}
          </button>
        </form>
        
        {message && (
          <div className={`message ${message.startsWith('Version registered!') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="versions-list">
        <h3>Version Repository</h3>
        <p className="info">Versions displayed in descending order (latest first)</p>
        
        {versions.length === 0 ? (
          <p className="no-data">No versions registered yet. Start by registering version 0.0.0 with code 0.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Version Code</th>
                <th>Version</th>
                <th>Checksum</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version._id}>
                  <td><strong className="version-code">{version.versionCode}</strong></td>
                  <td className="version-string">{version.versionString}</td>
                  <td><code className="checksum">{version.checksum}</code></td>
                  <td>{new Date(version.createdAt).toLocaleString()}</td>
                  <td>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(version._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="hierarchy-info">
        <h3>Update Hierarchy Rules</h3>
        <ul>
          <li>Updates must follow sequential order: 0, 1, 2, 3</li>
          <li>Direct updates to latest version are NOT allowed</li>
          <li>Device must pass through all intermediate versions</li>
          <li>Example: To update from v1 to v3, device updates: v1 - v2 - v3</li>
        </ul>
      </div>
    </div>
  );
}

export default VersionManagement;
