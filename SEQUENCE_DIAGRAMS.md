# Sequence Diagrams for MDM System

## Website to Visualize

**Mermaid Live Editor**: https://mermaid.live

Copy any of the diagrams below and paste them into the editor to see the visual diagram.

---

## 1. Device Heartbeat Flow

```mermaid
sequenceDiagram
    participant Device
    participant Server
    participant MongoDB
    
    Device->>Server: Send Heartbeat (IMEI, Region, Version)
    Server->>MongoDB: Update lastHeartbeat timestamp
    Server->>MongoDB: Check for pending updates
    MongoDB-->>Server: Return pending updates
    alt Update Available
        Server-->>Device: Response with updateAvailable: true
    else No Update
        Server-->>Device: Response with updateAvailable: false
    end
```

---

## 2. High-Level Update Flow (Simple)

```mermaid
sequenceDiagram
    participant Admin
    participant Server
    participant Device
    
    Admin->>Server: Register Version
    Admin->>Server: Push Update
    Device->>Server: Heartbeat
    Server-->>Device: Update Available
    Device->>Server: Accept Update
    Server-->>Device: Download & Install
    Device->>Server: Update Complete
    Admin->>Server: View Analytics
```

---

## 3. Admin Creates and Pushes Update (Detailed)

```mermaid
sequenceDiagram
    participant Admin
    participant Server
    participant MongoDB
    
    Admin->>Server: Register Version (1.0.0, code: 1)
    Server->>MongoDB: Save Version
    MongoDB-->>Server: Version saved
    Server-->>Admin: Success
    
    Admin->>Server: Push Update (region, oldVersion, newVersion)
    Server->>MongoDB: Fetch matching devices
    MongoDB-->>Server: Return device list
    Server->>MongoDB: Create LiveUpdate record
    Server->>MongoDB: Create UpdateHistory for each device
    MongoDB-->>Server: Records created
    Server-->>Admin: Update scheduled successfully
```

---

## 4. Device Receives and Accepts Update

```mermaid
sequenceDiagram
    participant Device
    participant WebSocket
    participant Server
    participant MongoDB
    
    Device->>Server: Heartbeat
    Server->>MongoDB: Check pending updates
    MongoDB-->>Server: Update found
    Server-->>Device: updateAvailable: true
    
    Device->>WebSocket: Connect via Socket.IO
    WebSocket->>Server: Connection established
    
    Server->>MongoDB: Log event (Device Notified)
    Server->>WebSocket: Emit update notification
    WebSocket-->>Device: Show update modal
    
    Device->>WebSocket: Accept update (updateId, IMEI)
    WebSocket->>Server: Process update request
    
    Server->>MongoDB: Log event (Download Started)
    Server->>MongoDB: Fetch version hierarchy
    MongoDB-->>Server: Return versions (1, 2, 3)
    
    loop For each version
        Server->>WebSocket: Emit progress (step X of Y)
        WebSocket-->>Device: Update progress bar
    end
    
    Server->>MongoDB: Log event (Download Completed)
    Server->>MongoDB: Log event (Installation Started)
    Server->>MongoDB: Update device.currentVersion
    Server->>MongoDB: Update LiveUpdate counters
    Server->>MongoDB: Log event (Installation Completed)
    
    Server->>WebSocket: Emit update complete
    WebSocket-->>Device: Show success message
    Device->>Device: Refresh device info
```

---

## 5. Device Rejects Update

```mermaid
sequenceDiagram
    participant Device
    participant Server
    participant MongoDB
    
    Device->>Server: Show update notification
    Device->>Server: POST /reject-update (IMEI, updateId)
    
    Server->>MongoDB: Find LiveUpdate
    MongoDB-->>Server: Return update record
    
    Server->>MongoDB: Log event (Update Rejected)
    Server->>MongoDB: Update UpdateHistory status
    Server->>MongoDB: Decrement pendingCount
    
    MongoDB-->>Server: Records updated
    Server-->>Device: Rejection confirmed
    Device->>Device: Close modal
```

---

## 6. Analytics Dashboard Query

```mermaid
sequenceDiagram
    participant Admin
    participant Server
    participant MongoDB
    
    Admin->>Server: GET /api/analytics/stats
    Server->>MongoDB: Count total UpdateHistory records
    Server->>MongoDB: Count completed records
    Server->>MongoDB: Count failed records
    Server->>MongoDB: Count rejected records
    MongoDB-->>Server: Return counts
    Server->>Server: Calculate rates and percentages
    Server-->>Admin: Return analytics data
    
    Admin->>Server: GET /api/analytics/device/:imei
    Server->>MongoDB: Find UpdateHistory by IMEI
    MongoDB-->>Server: Return timeline events
    Server-->>Admin: Return device timeline
    
    Admin->>Server: GET /api/analytics/region-adoption
    Server->>MongoDB: Find all devices
    MongoDB-->>Server: Return devices with regions and versions
    Server->>Server: Build region-version map
    Server-->>Admin: Return heatmap data
```

---

## 7. Complete Update Workflow

```mermaid
sequenceDiagram
    participant Admin
    participant Server
    participant MongoDB
    participant WebSocket
    participant Device
    
    rect rgb(240, 240, 255)
        Note over Admin,Server: Phase 1: Setup
        Admin->>Server: Register versions 1.0.0, 2.0.0, 3.0.0
        Server->>MongoDB: Save versions
    end
    
    rect rgb(255, 240, 240)
        Note over Admin,MongoDB: Phase 2: Schedule Update
        Admin->>Server: Push update (region: US, 0.0.0 to 3.0.0)
        Server->>MongoDB: Create LiveUpdate
        Server->>MongoDB: Create UpdateHistory logs
        Note over MongoDB: Status: scheduled
    end
    
    rect rgb(240, 255, 240)
        Note over Device,MongoDB: Phase 3: Device Detection
        Device->>Server: Heartbeat
        Server->>MongoDB: Check pending updates
        MongoDB-->>Server: Update found
        Server-->>Device: updateAvailable: true
    end
    
    rect rgb(255, 255, 240)
        Note over Device,MongoDB: Phase 4: Download & Install
        Device->>WebSocket: Accept update
        Server->>MongoDB: Log: Download Started
        Server->>WebSocket: Send version chunks with progress
        Server->>MongoDB: Log: Download Completed
        Server->>MongoDB: Log: Installation Started
        Server->>MongoDB: Update device version
        Server->>MongoDB: Log: Installation Completed
        Server->>MongoDB: Update LiveUpdate counters
        Note over MongoDB: Status: installation_completed
    end
    
    rect rgb(250, 240, 255)
        Note over Admin,MongoDB: Phase 5: Monitoring
        Admin->>Server: View Analytics
        Server->>MongoDB: Query UpdateHistory
        MongoDB-->>Server: Aggregate statistics
        Server-->>Admin: Display progress, rates, timeline
    end
```

---

## How to Use

1. Go to https://mermaid.live
2. Copy any of the diagram codes above
3. Paste into the editor
4. The diagram will render automatically
5. You can download as PNG or SVG

Alternative websites:
- https://mermaid-js.github.io/mermaid-live-editor
- https://mermaid.ink (for quick links)
