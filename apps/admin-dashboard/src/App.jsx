import React, { useState } from "react";

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

  const [platform, setPlatform] = useState("");
  const [data, setData] = useState({ devices: [], count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [pushStatus, setPushStatus] = useState(null);

  const fetchVersions = async (plat) => {
    try {
      const res = await fetch(`http://localhost:3000/api/versions?${plat ? `platform=${plat}` : ""}`);
      const d = await res.json();
      setVersions(d.ok ? d.versions || [] : []);
    } catch { setVersions([]); }
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!region && !version && !platform) return setError("Need region/version/platform");
    setLoading(true); setError(null); setSelectedDevices([]); setSelectedVersion("");
    try {
      const params = new URLSearchParams({ ...(region && { region }), ...(version && { version }), ...(platform && { platform }) });
      const res = await fetch(`http://localhost:3000/api/devices/query?${params}`);
      const result = await res.json();
      if (result.ok) {
        setData({ devices: result.devices || [], count: result.count });
        const plat = platform || result.devices?.[0]?.platform;
        if (plat) fetchVersions(plat);
      } else setError(result.error);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const toggleDevice = id => setSelectedDevices(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  const selectAll = () => setSelectedDevices(data.devices.map(d => d.deviceId));

  const pushUpdate = async () => {
    if (!selectedVersion || !selectedDevices.length) return setPushStatus({ error: "Select devices/version" });
    const ver = versions.find(v => v.versionCode === +selectedVersion);
    if (!ver) return;
    try {
      const res = await fetch("http://localhost:3000/api/devices/push-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceIds: selectedDevices, targetVersionCode: ver.versionCode, targetVersionName: ver.versionName, requestedBy: "admin" })
      });
      const result = await res.json();
      setPushStatus(result.ok ? { success: result.message } : { error: result.error });
      if (result.ok) setSelectedDevices([]);
    } catch (err) { setPushStatus({ error: err.message }); }
  };

  return (
    <section className="panel">
      <h2>Device Query</h2>
      <form onSubmit={handleQuery}>
        <input placeholder="Region" value={region} onChange={(e) => setRegion(e.target.value)} />
        <input placeholder="Version" value={version} onChange={(e) => setVersion(e.target.value)} />
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">All Platforms</option>
          <option value="iOS">iOS</option>
          <option value="Android">Android</option>
          <option value="web">web</option>
        </select>
        <button type="submit" disabled={loading}>{loading ? "Loading..." : "Query"}</button>
      </form>

      {error && <div className="error">{error}</div>}
      {data.devices.length > 0 && (
        <div className="results">
          <h3>{data.count} Device(s) Found</h3>
          <table className="device-table">
            <thead>
              <tr>
                <th><input type="checkbox" onChange={selectAll} checked={selectedDevices.length === data.devices.length && data.devices.length > 0} /></th>
                <th>ID</th><th>Version</th><th>Platform</th><th>Region</th><th>Last Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {data.devices.map((d) => (
                <tr key={d._id || d.deviceId}>
                  <td><input type="checkbox" checked={selectedDevices.includes(d.deviceId)} onChange={() => toggleDevice(d.deviceId)} /></td>
                  <td>{d.deviceId}</td>
                  <td>{d.currentVersion}</td>
                  <td>{d.platform}</td>
                  <td>{d.region}</td>
                  <td>{d.lastHeartbeatAt ? new Date(d.lastHeartbeatAt).toLocaleString() : "Never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="push-update-section">
            <select value={selectedVersion} onChange={e => setSelectedVersion(e.target.value)}>
              <option value="">Select Target Version</option>
              {versions.map(v => (
                <option key={v.versionCode} value={v.versionCode}>{v.versionName} ({v.versionCode})</option>
              ))}
            </select>
            <button onClick={pushUpdate} disabled={!selectedDevices.length || !selectedVersion}>
              Push Update to {selectedDevices.length} Device(s)
            </button>
          </div>
          {pushStatus && <div className={pushStatus.error ? "error" : "success-card"}>{pushStatus.error || pushStatus.success}</div>}
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
