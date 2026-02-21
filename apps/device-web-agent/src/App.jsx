import React from "react";

const capabilities = [
  "Send heartbeat",
  "Receive update command",
  "Execute update (config reload)",
  "Report lifecycle state"
];

export default function App() {
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
        <div className="state-row"><span>Status:</span><strong>Idle</strong></div>
        <div className="state-row"><span>Last Heartbeat:</span><strong>Not sent</strong></div>
        <div className="state-row"><span>Current Version:</span><strong>0.0.0-dev</strong></div>
      </section>
    </main>
  );
}
