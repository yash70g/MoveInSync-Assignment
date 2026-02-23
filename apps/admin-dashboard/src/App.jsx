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

function DashboardMonitor() {
  const [region, setRegion] = useState("");
  const [platform, setPlatform] = useState("");
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        ...(region && { region }), 
        ...(platform && { platform }) 
      });
      const res = await fetch(`http://localhost:3000/api/dashboard/updates?${params}`);
      const d = await res.json();
      if (d.ok) setDashData(d);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <section className="panel">
      <h2>Real-Time Monitoring Dashboard</h2>
      <form onSubmit={(e) => { e.preventDefault(); fetchDashboard(); }}>
        <input placeholder="Region" value={region} onChange={e => setRegion(e.target.value)} />
        <select value={platform} onChange={e => setPlatform(e.target.value)}>
          <option value="">All Platforms</option>
          <option value="iOS">iOS</option>
          <option value="Android">Android</option>
          <option value="web">web</option>
        </select>
        <button type="submit" disabled={loading}>{loading ? "Loading..." : "Load Dashboard"}</button>
      </form>

      {dashData && (
        <div className="dashboard">
          <div className="stats-grid">
            <div className="stat-card"><strong>Total Devices:</strong> {dashData.stats.totalDevices}</div>
            <div className="stat-card"><strong>Updates Scheduled:</strong> {dashData.stats.updatesScheduled}</div>
            <div className="stat-card success"><strong>✓ Completed:</strong> {dashData.stats.completed}</div>
            <div className="stat-card error"><strong>✗ Failed:</strong> {dashData.stats.failed}</div>
            <div className="stat-card warning"><strong>⏳ In Progress:</strong> {dashData.stats.inProgress}</div>
            <div className="stat-card"><strong>⏸ Pending:</strong> {dashData.stats.pending}</div>
          </div>

          <div className="heatmap-section">
            <h3>📈 Version Heatmap</h3>
            <table>
              <thead><tr><th>Version</th><th>Device Count</th></tr></thead>
              <tbody>
                {Object.entries(dashData.versionHeatmap).sort((a,b) => b[1]-a[1]).map(([v, c]) => (
                  <tr key={v}><td>{v}</td><td><div className="bar" style={{width: `${Math.min(100, c*10)}%`}}>{c}</div></td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="region-section">
            <h3>🌍 Region-wise Adoption</h3>
            <table>
              <thead><tr><th>Region</th><th>Total</th><th>Updated</th><th>Progress</th></tr></thead>
              <tbody>
                {Object.entries(dashData.regionBreakdown).map(([r, {total, updated}]) => (
                  <tr key={r}>
                    <td>{r}</td><td>{total}</td><td>{updated}</td>
                    <td><div className="progress-bar"><div className="progress-fill" style={{width: `${total ? (updated/total)*100 : 0}%`}}></div></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function UpdateTimeline() {
  const [updateId, setUpdateId] = useState("");
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTimeline = async () => {
    if (!updateId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/updates/${updateId}/timeline`);
      const d = await res.json();
      if (d.ok) setTimeline(d);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <section className="panel">
      <h2>Update Timeline & Tracking</h2>
      <div style={{display: 'flex', gap: '10px'}}>
        <input 
          placeholder="Update ID (upd_...)" 
          value={updateId} 
          onChange={e => setUpdateId(e.target.value)} 
          style={{flex: 1}}
        />
        <button onClick={fetchTimeline} disabled={loading || !updateId}>{loading ? "Loading..." : "Load Timeline"}</button>
      </div>

      {timeline && (
        <div className="timeline-view">
          <h3>Update: {timeline.targetVersion}</h3>
          <p>Status: <strong>{timeline.status.toUpperCase()}</strong> | Current Stage: <strong>{timeline.currentStage}</strong></p>
          <div className="timeline">
            {timeline.timeline.map((event, idx) => (
              <div key={idx} className={`timeline-event ${event.stage.toLowerCase()}`}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <strong>{event.stage}</strong>
                  <p>{new Date(event.timestamp).toLocaleString()}</p>
                  {event.failureReason && <p className="failure">❌ Failed: {event.failureReason}</p>}
                  {event.details && Object.keys(event.details).length > 0 && (
                    <pre className="details">{JSON.stringify(event.details, null, 2)}</pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

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
      
      <DashboardMonitor />
      <UpdateTimeline />
      <DeviceQuery />
    </main>
  );
}
