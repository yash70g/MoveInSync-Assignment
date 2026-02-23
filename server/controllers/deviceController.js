import Device from '../models/Device.js';
import LiveUpdate from '../models/LiveUpdate.js';

export const heartbeat = async (req, res) => {
  try {
    const { imei, region, currentVersion, lastHeartbeat } = req.body;

    if (!imei || !region || !currentVersion) {
      return res.status(400).json({ 
        success: false,
        message: 'IMEI, region, and currentVersion are required' 
      });
    }
    
    let device = await Device.findOne({ imei });
    
    if (device) {
      device.region = region;
      device.currentVersion = currentVersion;
      device.lastHeartbeat = lastHeartbeat || new Date();
      await device.save();
    } else {
      device = await Device.create({
        imei,
        region,
        currentVersion,
        lastHeartbeat: lastHeartbeat || new Date()
      });
    }

    const pendingUpdate = await LiveUpdate.findOne({
      status: 'active',
      oldVersion: currentVersion,
      $or: [
        { region: region },
        { region: null }
      ],
      targetDevices: imei
    });

    if (pendingUpdate) {
      return res.status(200).json({
        success: true,
        message: device ? 'Heartbeat updated' : 'Device registered successfully',
        data: device,
        updateAvailable: true,
        updateInfo: {
          updateId: pendingUpdate._id,
          oldVersion: pendingUpdate.oldVersion,
          newVersion: pendingUpdate.newVersion,
          hierarchyOrder: pendingUpdate.hierarchyOrder
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: device ? 'Heartbeat updated' : 'Device registered successfully',
      data: device,
      updateAvailable: false
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAllDevices = async (req, res) => {
  try {
    const devices = await Device.find().sort({ lastHeartbeat: -1 });
    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
