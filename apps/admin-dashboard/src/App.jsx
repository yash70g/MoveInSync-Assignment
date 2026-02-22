import React, { useState, useEffect } from "react";

const featureCards = [
  {
    title: "Create rollouts",
    description: "Draft phased releases, choose cohorts, and submit execution plans."
  },
  {
    title: "Approve releases",
    description: "Review compliance checks and approve or reject rollout requests."
  },
  {
    title: "View analytics",
    description: "Track success rate, failures, and lifecycle telemetry by cohort."
  },
  {
    title: "Track Live Devices",
    description: "Track devices in real-time"
  }
];

function DeviceQuery() {
  const [region, setRegion] = useState("");
  const [version, setVersion] = useState("");
  const [devices, setDevices] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!region && !version) {
      setError("Please enter region or version");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (region) params.append("region", region);
      if (version) params.append("version", version);

      const response = await fetch(`http://localhost:3000/api/devices/query?${params}`);
      const data = await response.json();

      if (data.ok) {
        setDevices(data.devices || []);
        setCount(data.count);
      } else {
        setError(data.error || "Failed to fetch devices");
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>Device Query</h2>
      <form onSubmit={handleQuery} className="query-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="Region (e.g., Bangalore)"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Version (e.g., 4.2)"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Query Devices"}
        </button>
        {devices.length > 0 && (
          <button 
            type="button" 
            onClick={handleQuery}
            disabled={loading}
            className="btn-secondary"
          >
            Refresh
          </button>
        )}
      </form>

      {error && <div className="error">{error}</div>}

      {devices.length > 0 && (
        <div className="results">
          <h3>Results: {count} device(s) found</h3>
          <table className="device-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Version</th>
                <th>Platform</th>
                <th>Region</th>
                <th>Last Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device._id || device.deviceId}>
                  <td>{device.deviceId}</td>
                  <td>{device.currentVersion}</td>
                  <td>{device.platform}</td>
                  <td>{device.region}</td>
                  <td>
                    {device.lastHeartbeatAt 
                      ? new Date(device.lastHeartbeatAt).toLocaleString()
                      : "Never"
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <h1>Admin Dashboard</h1>
        <p>Govern rollout policy, approvals, and observability.</p>
      </header>

      <section className="panel">
        <h2>Core Workflows</h2>
        <div className="grid">
          {featureCards.map((card) => (
            <article key={card.title} className="card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <DeviceQuery />
    </main>
  );
}
