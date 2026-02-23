import { useState, useEffect } from 'react';
import { getAllLiveUpdates, deleteLiveUpdate } from '../services/adminApi';

function LiveUpdatesList() {
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLiveUpdates();
  }, []);

  const fetchLiveUpdates = async () => {
    try {
      const response = await getAllLiveUpdates();
      if (response.success) setLiveUpdates(response.data);
    } catch (error) {}
  };

  const handleDelete = async (updateId) => {
    if (!window.confirm('Delete this live update?')) return;
    try {
      await deleteLiveUpdate(updateId);
      setMessage('Deleted successfully!');
      fetchLiveUpdates();
    } catch (error) {
      setMessage('Delete failed');
    }
  };

  return (
    <div>
      <h3>Active Live Updates</h3>
      {liveUpdates.length === 0 ? (
        <p>No live updates created yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Region</th>
              <th>Old Version</th>
              <th>New Version</th>
              <th>Hierarchy Order</th>
              <th>Pending</th>
              <th>Completed</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {liveUpdates.map(update => (
              <tr key={update._id}>
                <td>{update.region || 'All'}</td>
                <td>{update.oldVersion}</td>
                <td>{update.newVersion}</td>
                <td>{update.hierarchyOrder.join(', ')}</td>
                <td>{update.pendingCount}</td>
                <td>{update.completedCount}</td>
                <td>{update.status}</td>
                <td>{new Date(update.createdAt).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleDelete(update._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {message && <div style={{ marginTop: '1rem', padding: '1rem' }}>{message}</div>}
    </div>
  );
}

export default LiveUpdatesList;
