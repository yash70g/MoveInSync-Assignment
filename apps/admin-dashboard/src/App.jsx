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

function VersionManagement() {
  const [appId, setAppId] = useState("device-web-agent");
  const [platform, setPlatform] = useState("Android");
  const [data, setData] = useState({ version: null, devices: [], count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vRes, dRes] = await Promise.all([
        fetch(`http://localhost:3000/api/versions/latest?appId=${appId}&platform=${platform}`),
        fetch(`http://localhost:3000/api/devices/needs-update?appId=${appId}&platform=${platform}`)
      ]);
      const [vData, dData] = await Promise.all([vRes.json(), dRes.json()]);
      setData({
        version: vData.ok ? vData.version : null,
        devices: dData.ok ? dData.devices || [] : [],
        count: dData.ok ? dData.devicesNeedingUpdate : 0
      });
      if (!vData.ok) setError(vData.error);
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appId && platform) fetchStatus();
  }, [appId, platform]);

  return (
    <section className="panel">
      <h2>📱 Version Management</h2>
      <div className="form-group">
        <label>App ID:</label>
        <input value={appId} onChange={(e) => setAppId(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Platform:</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option>Android</option>
          <option>iOS</option>
          <option>Web</option>
        </select>
      </div>
      <button onClick={fetchStatus} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>

      {error && <div className="error">{error}</div>}
      {data.version && (
        <div className="version-card">
          <h3>✅ Latest: {data.version.versionName}</h3>
          <p><strong>Code:</strong> {data.version.versionCode}</p>
        </div>
      )}
      {data.count > 0 && (
        <div className="alert-card">
          <h3>⚠️ {data.count} Device(s) Need Update</h3>
          <table className="device-table">
            <thead>
              <tr><th>Device ID</th><th>Version</th><th>Region</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.devices.map((d) => (
                <tr key={d._id}><td>{d.deviceId}</td><td>{d.currentVersion}</td><td>{d.region}</td><td><span className="badge-warn">Pending</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data.count === 0 && data.version && <div className="success-card">✅ All up-to-date!</div>}
    </section>
  );
}

function DeviceQuery() {
  const [region, setRegion] = useState("");
  const [version, setVersion] = useState("");
  const [data, setData] = useState({ devices: [], count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!region && !version) {
      setError("Provide region or version");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ ...(region && { region }), ...(version && { version }) });
      const res = await fetch(`http://localhost:3000/api/devices/query?${params}`);
      const result = await res.json();
      if (result.ok) {
        setData({ devices: result.devices || [], count: result.count });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>🔍 Device Query</h2>
      <form onSubmit={handleQuery}>
        <input placeholder="Region" value={region} onChange={(e) => setRegion(e.target.value)} />
        <input placeholder="Version" value={version} onChange={(e) => setVersion(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? "Loading..." : "Query"}</button>
      </form>

      {error && <div className="error">{error}</div>}
      {data.devices.length > 0 && (
        <div className="results">
          <h3>📊 {data.count} Device(s) Found</h3>
          <table className="device-table">
            <thead>
              <tr><th>ID</th><th>Version</th><th>Platform</th><th>Region</th><th>Last Heartbeat</th></tr>
            </thead>
            <tbody>
              {data.devices.map((d) => (
                <tr key={d._id || d.deviceId}>
                  <td>{d.deviceId}</td>
                  <td>{d.currentVersion}</td>
                  <td>{d.platform}</td>
                  <td>{d.region}</td>
                  <td>{d.lastHeartbeatAt ? new Date(d.lastHeartbeatAt).toLocaleString() : "Never"}</td>
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
      <VersionManagement />
      <DeviceQuery />
    </main>
  );
}
