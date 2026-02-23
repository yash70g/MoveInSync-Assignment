import Device from '../models/Device.js';

// @desc    Handle device heartbeat
// @route   POST /api/devices/heartbeat
// @access  Public
export const heartbeat = async (req, res) => {
  try {
    const { imei, region, currentVersion, lastHeartbeat } = req.body;

    // Validate required fields
    if (!imei || !region || !currentVersion) {
      return res.status(400).json({ 
        success: false,
        message: 'IMEI, region, and currentVersion are required' 
      });
    }

    // Check if device exists
    let device = await Device.findOne({ imei });

    if (device) {
      // Update existing device
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
      // Register new device
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

// @desc    Get all devices
// @route   GET /api/devices
// @access  Public
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
