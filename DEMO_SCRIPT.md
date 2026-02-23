# Demo Video Script - Mobile Device Management System

## Opening (15 seconds)

"Hello! Today I'll show you a Mobile Device Management system that allows admins to push software updates to devices in real-time. Let's see how it works."

## Part 1: Client View - Device Heartbeat (30 seconds)

1. Show the browser at localhost:5173
2. Point to the device information displayed:
   - "Here we have a simulated mobile device"
   - "You can see its IMEI number, region, and current version"
   - "This device automatically sends heartbeat signals to the server every 10 seconds to stay connected"

3. Open browser console (F12)
   - "In the console, you can see the heartbeat being sent regularly"
   - Wait a few seconds to show multiple heartbeat logs

## Part 2: Admin Dashboard - Version Management (45 seconds)

1. Click "Go to Admin Dashboard"
   - "Now let's switch to the admin view"

2. Click "Version Management"
   - "First, admins need to register software versions"

3. Register a few versions:
   - "Let's register version 1.0.0 with code 1"
   - Fill form and click Register
   - "Version 2.0.0 with code 2"
   - Fill form and click Register
   - "And version 3.0.0 with code 3"
   - Fill form and click Register

4. Show the versions list
   - "Here's our version hierarchy - each version has a code number that determines update order"

## Part 3: Push Updates (30 seconds)

1. Click "Push Updates"
   - "Now let's push an update to devices"

2. Select filter criteria:
   - "We can filter devices by region or current version"
   - Select a region or version filter

3. Click "Fetch Devices"
   - "Here are all matching devices"

4. Select one or more devices
   - "Select the devices to update"

5. Choose target version from dropdown
   - "Choose the target version - let's go to version 3.0.0"

6. Click "Push Update"
   - "And push the update"
   - "You'll see a success message"

## Part 4: Device Updates in Real-Time (60 seconds)

1. Click "Back to Client View" 
   - "Let's switch back to the device"

2. Wait for update notification popup
   - "Within seconds, the device receives the update notification"
   - "This happens in real-time using WebSocket connections"

3. Point to the popup details:
   - "The device sees it needs to update from version 0.0.0 to 3.0.0"
   - "It will download versions 1, 2, and 3 in order"

4. Click "Accept Update"
   - "The user accepts the update"

5. Show the progress bar
   - "Watch the download progress"
   - "The system downloads each version sequentially"
   - Wait for progress to complete

6. Show the updated version
   - "And now the device is updated to version 3.0.0"
   - Point to the updated version number on screen

## Part 5: Active Updates (20 seconds)

1. Go back to Admin Dashboard
2. Click "Active Updates"
   - "Admins can monitor all active update campaigns"
   - "See how many devices are pending, completed"
   - Point to the statistics in the table

## Part 6: Analytics Dashboard (60 seconds)

1. Click "Analytics"
   - "This is where admins monitor everything"

2. Point to Update Rollout Progress section:
   - "Total devices that received updates"
   - "How many completed successfully"
   - "Pending and failed devices"
   - Point to the progress bar
   - "Overall success and failure rates"

3. Scroll to Region-wise Version Heatmap:
   - "This table shows version distribution across regions"
   - "Admins can see which versions are running in each region"

4. Show Device Timeline:
   - "Select a specific device from the dropdown"
   - Select the IMEI that just updated
   - "Here's the complete update history for this device"
   - Scroll through the timeline events:
     - "Update scheduled by admin"
     - "Device notified"
     - "Download started and completed"
     - "Installation started and completed"
   - "Every step is logged with timestamps for full audit trail"

## Part 7: Reject Update Demo (45 seconds)

1. Go back to Push Updates
   - "Let's see what happens when a device rejects an update"

2. Push another update to the same device
   - Select device, choose a version, push update

3. Return to Client View
   - Wait for notification popup

4. Click "Reject"
   - "The user can reject the update"
   - "The update is cancelled immediately"

5. Go to Analytics
   - Select the device again
   - "And this rejection is also logged in the timeline"
   - Point to the "Update Rejected" event

## Closing (15 seconds)

"So that's the Mobile Device Management system - real-time updates, version hierarchy, complete audit logging, and comprehensive analytics. All built with React, Node.js, MongoDB, and Socket.IO. Thanks for watching!"

---

## Tips for Recording

- **Keep browser window maximized** for better visibility
- **Speak clearly and at moderate pace**
- **Pause briefly** after each major action to let viewers see the result
- **Use mouse cursor movements** to highlight what you're pointing to
- **Total video length**: Approximately 5-6 minutes
- **Have MongoDB and both servers running** before starting
- **Test the flow once** before recording to ensure smooth demo
- **Clear any old data** from database for clean demo

## Pre-Recording Checklist

- [ ] MongoDB running
- [ ] Server running on localhost:5000
- [ ] Client running on localhost:5173
- [ ] Database cleared or has minimal test data
- [ ] No other tabs open that might show notifications
- [ ] Browser console works (F12)
- [ ] Microphone tested
- [ ] Screen recording software ready
