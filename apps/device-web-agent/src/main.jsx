import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function getOrCreateDeviceId() {
  const key = "deviceId";
  let id = localStorage.getItem(key);

  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(key, id);
  }

  return id;
}

async function sendOpenHeartbeat() {
  try {
    await fetch(`${API_BASE}/api/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "device_open",
        deviceId: getOrCreateDeviceId(),
        ts: new Date().toISOString(),
      }),
      // allow the browser to send the request even while unloading
      keepalive: true,
    });
  } catch {
    // heartbeat is best-effort; ignore failures
  }
}

// fire once when web agent starts
sendOpenHeartbeat();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
