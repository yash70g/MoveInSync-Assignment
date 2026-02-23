import Device from '../models/Device.js';
import LiveUpdate from '../models/LiveUpdate.js';
import Version from '../models/Version.js';
import UpdateHistory from '../models/UpdateHistory.js';

const logEvent = async (imei, updateId, event, details = '') => {
  try {
    let history = await UpdateHistory.findOne({ imei, updateId });
    if (!history) {
      const liveUpdate = await LiveUpdate.findById(updateId);
      history = await UpdateHistory.create({
        imei,
        updateId,
        oldVersion: liveUpdate?.oldVersion,
        newVersion: liveUpdate?.newVersion,
        status: 'scheduled',
        adminId: 'admin',
        targetCriteria: {
          region: liveUpdate?.region,
          version: liveUpdate?.oldVersion
        },
        timeline: []
      });
    }
    history.timeline.push({ event, timestamp: new Date(), details });
    await history.save();
  } catch (error) {
    console.error('Log event error:', error);
  }
};

export const handleUpdateProcess = async (socket, imei, updateId) => {
  try {
    const liveUpdate = await LiveUpdate.findById(updateId);
    if (!liveUpdate) {
      socket.emit('update-error', { message: 'Update not found' });
      return;
    }

    const device = await Device.findOne({ imei });
    if (!device) {
      socket.emit('update-error', { message: 'Device not found' });
      return;
    }

    await logEvent(imei, updateId, 'Device Notified', 'Update notification received by device');
    await logEvent(imei, updateId, 'Download Started', 'Beginning version download');

    const versions = await Version.find({
      versionCode: { $in: liveUpdate.hierarchyOrder }
    }).sort({ versionCode: 1 });

    const totalSteps = liveUpdate.hierarchyOrder.length;
    const delayPerStep = 5000 / totalSteps;

    for (let i = 0; i < versions.length; i++) {
      const version = versions[i];
      
      await new Promise(resolve => setTimeout(resolve, delayPerStep));
      
      socket.emit('update-progress', {
        step: i + 1,
        totalSteps,
        currentVersion: version.versionString,
        versionCode: version.versionCode,
        checksum: version.checksum,
        progress: Math.round(((i + 1) / totalSteps) * 100)
      });
    }

    await logEvent(imei, updateId, 'Download Completed', 'All versions downloaded successfully');
    await logEvent(imei, updateId, 'Installation Started', 'Beginning installation process');

    device.currentVersion = liveUpdate.newVersion;
    await device.save();

    await logEvent(imei, updateId, 'Installation Completed', `Updated to version ${liveUpdate.newVersion}`);

    const history = await UpdateHistory.findOne({ imei, updateId });
    if (history) {
      history.status = 'installation_completed';
      await history.save();
    }

    liveUpdate.completedCount += 1;
    if (liveUpdate.pendingCount > 0) {
      liveUpdate.pendingCount -= 1;
    }

    if (liveUpdate.pendingCount <= 0) {
      liveUpdate.status = 'completed';
    }
    await liveUpdate.save();

    socket.emit('update-complete', {
      newVersion: liveUpdate.newVersion,
      checksum: versions[versions.length - 1].checksum
    });

  } catch (error) {
    await logEvent(imei, updateId, 'Update Failed', error.message);
    const history = await UpdateHistory.findOne({ imei, updateId });
    if (history) {
      history.status = 'failed';
      history.failureReason = error.message;
      history.stage = 'download';
      await history.save();
    }
    socket.emit('update-error', { message: error.message });
  }
};

export const rejectUpdate = async (req, res) => {
  try {
    const { imei, updateId } = req.body;

    const liveUpdate = await LiveUpdate.findById(updateId);
    if (!liveUpdate) {
      return res.status(404).json({ success: false, message: 'Update not found' });
    }

    await logEvent(imei, updateId, 'Update Rejected', 'User declined the update');
    
    const history = await UpdateHistory.findOne({ imei, updateId });
    if (history) {
      history.status = 'rejected';
      await history.save();
    }

    if (liveUpdate.targetDevices.includes(imei) && liveUpdate.pendingCount > 0) {
      liveUpdate.pendingCount -= 1;
      await liveUpdate.save();
    }

    res.status(200).json({ success: true, message: 'Update rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
