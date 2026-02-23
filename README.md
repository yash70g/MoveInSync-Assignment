# Mobile Device Management System

A web-based system to manage and update mobile devices remotely. Admins can push software updates to devices, and devices can accept or reject these updates in real-time.

## What This Does

- Devices send heartbeat signals to stay connected with the server
- Admins can register new software versions with version numbers
- Admins can push updates to specific devices based on region or version
- Devices receive update notifications and can choose to accept or reject
- Updates happen in real-time with a progress bar showing download status
- Admins can monitor all update activities through an analytics dashboard

## Setup Instructions

### Prerequisites

Make sure you have these installed:
- Node.js (version 14 or higher)
- MongoDB (running on your computer)

**OR** if using Docker:
- Docker
- Docker Compose

## Option 1: Running with Docker (Recommended)

This is the easiest way to run the application. Docker will automatically set up MongoDB, the server, and the client.

1. Make sure Docker is running on your computer

2. From the project root folder, run:
```
docker-compose up
```

3. Wait for all containers to start (this may take a minute the first time)

4. Open your browser and go to http://localhost:5173

5. To stop the application, press `Ctrl+C` and then run:
```
docker-compose down
```

That's it! Docker handles everything including MongoDB setup.

## Option 2: Manual Installation

## Option 2: Manual Installation

### Installation Steps

1. Open the project folder in your terminal

2. Create environment file for server:
```
cd server
cp .env.example .env
```

3. Install server dependencies:
```
npm install
```

4. Install client dependencies:
```
cd ../client
npm install
```

### Running Manually

Make sure MongoDB is running on your computer first!

You need to run both the server and client:

1. Start the server (in one terminal):
```
cd server
npm run dev
```
Server will run on http://localhost:5000

2. Start the client (in another terminal):
```
cd client
npm run dev
```
Client will run on http://localhost:5173

3. Open your browser and go to http://localhost:5173

## Authentication

The system includes simple authentication with username and 4-digit PIN.

### First Time Setup

1. Go to http://localhost:5173/login
2. Click "Need an account? Register"
3. Enter username, 4-digit PIN, and select role (Client or Admin)
4. Click Register

### Test Accounts

Create test accounts like:
- **Admin Account**: username: `admin`, PIN: `1234`, role: Admin
- **Client Account**: username: `client`, PIN: `5678`, role: Client

### Login

1. Enter your username and 4-digit PIN
2. Click Login
3. Admin users will be redirected to Admin Dashboard
4. Client users will see the Client View

### Logout

- Click the "Logout" button in the top right corner (Admin Dashboard)
- Or click "Logout" in the Client View

## How to Use

### For Devices (Client View)

1. Log in with a client or admin account
2. The app will act like a mobile device
3. Your device automatically sends heartbeat signals every 10 seconds
3. If an update is available, you'll see a notification popup
4. Click "Accept" to download and install the update
5. Click "Reject" if you don't want to update
6. A progress bar shows the download status
7. Once complete, your device version is updated

### For Admins (Admin Dashboard)

1. Log in with an admin account
2. Click "Go to Admin Dashboard" to access admin features

#### Version Management
- Register new software versions with version numbers like 1.0.0
- Each version gets a unique code number (0, 1, 2, 3, etc.)
- Higher code numbers mean newer versions

#### Push Updates
- Select devices by region or current version
- Pick multiple devices to update
- Choose the target version you want to push
- Click "Push Update" to send the update notification

#### Active Updates
- See all ongoing update campaigns
- Check how many devices are pending, completed
- Delete update campaigns if needed

#### Analytics Dashboard
- View total devices, completed updates, pending updates, and failed updates
- See success and failure rates
- Check progress percentage with a visual progress bar
- View region-wise version distribution in a table
- Select a device to see its complete update history timeline
- Every event (notification sent, download started, installation completed, etc.) is logged with timestamps

## Features Overview

### Heartbeat System
- Devices automatically ping the server every 10 seconds
- Server checks if any updates are waiting for that device
- Keeps the connection alive and responsive

### Version Hierarchy
- Updates follow a specific order (version 0 to 1 to 2 to 3)
- System ensures devices get all intermediate versions
- Example: Device on version 0 updating to version 3 will download versions 1, 2, and 3

### Real-Time Updates
- Uses WebSocket for instant communication
- No need to refresh the page
- Updates happen live with progress tracking

### Audit Logging
- Every step of the update process is logged
- Track when updates are scheduled, downloaded, installed
- See why updates fail and at which stage
- Complete timeline for troubleshooting

## Project Structure

```
MoveInSync-Assignment/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── services/    # API calls
│   │   └── utils/       # Helper functions
│   └── package.json
│
├── server/              # Backend Node.js application
│   ├── models/         # Database schemas
│   ├── controllers/    # Business logic
│   ├── routes/         # API endpoints
│   └── package.json
│
└── README.md           # This file
```

## Technologies Used

- Frontend: React
- Backend: Node.js with Express
- Database: MongoDB
- Real-time: Socket.IO for WebSocket connections

## Notes

- Make sure MongoDB is running before starting the server
- The system uses mock data for device information
- Updates are simulated with a 5-second download process
- All times are logged with timestamps for tracking
