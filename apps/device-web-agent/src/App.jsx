import React, { useState, useEffect } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

function getOrCreateDeviceId() {
  const key = "deviceId";
  let id = localStorage.getItem(key);
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function getLocalDeviceVersion() {
  return localStorage.getItem("deviceVersion") || "0.0.0";
}

async function sendHeartbeat() {
  const version = getLocalDeviceVersion();
  try {
    const res = await fetch(`${API_BASE}/api/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "device_heartbeat",
        deviceId: getOrCreateDeviceId(),
        ts: new Date().toISOString(),
        version,
        platform: "web",
        region: "Bangalore"
      }),
      keepalive: true,
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const capabilities = [
  "Send heartbeat",
  "Receive update command",
  "Execute update (config reload)",
  "Report lifecycle state"
];

export default function App() {
  const [status, setStatus] = useState("");
  const [lastHeartbeat, setLastHeartbeat] = useState("Not sent");
  const [version, setVersion] = useState("0.0.0");

  useEffect(() => {
    setVersion(getLocalDeviceVersion());    
    // Send heartbeat on mount
    sendHeartbeat().then((result) => {
      if (result.ok) {
        setLastHeartbeat(new Date().toLocaleTimeString());
      }
    });
  }, []);

  const handleHeartbeat = async () => {
    setStatus("Sending...");
    const result = await sendHeartbeat();
    if (result.ok) {
      setLastHeartbeat(new Date().toLocaleTimeString());
      setStatus("Sent");
    } else {
      setStatus(`${result.error}`);
    }
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <main className="page">
      <header className="hero">
        <h1>Device Web Agent</h1>
        <p>PWA-style frontend for device update control loop simulation.</p>
      </header>

      <section className="panel">
        <h2>Agent Capabilities</h2>
        <ul>
          {capabilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Current State</h2>
        <div className="state-row"><span>Status:</span><strong>{status || "Idle"}</strong></div>
        <div className="state-row"><span>Last Heartbeat:</span><strong>{lastHeartbeat}</strong></div>
        <div className="state-row"><span>Current Version:</span><strong>{version}</strong></div>
      </section>

      <section className="panel">
        <button onClick={handleHeartbeat}>Send Heartbeat</button>
      </section>
    </main>
  );
}
