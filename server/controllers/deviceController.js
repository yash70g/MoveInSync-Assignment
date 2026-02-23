import Device from '../models/Device.js';

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
      return res.status(200).json({
        success: true,
        message: 'Heartbeat updated',
        data: device
      });
    } else {
      device = await Device.create({
        imei,
        region,
        currentVersion,
        lastHeartbeat: lastHeartbeat || new Date()
      });

      return res.status(201).json({
        success: true,
        message: 'Device registered successfully',
        data: device
      });
    }
  } catch (error) {
    console.error('Heartbeat error:', error);
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
