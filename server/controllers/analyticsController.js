import UpdateHistory from '../models/UpdateHistory.js';
import LiveUpdate from '../models/LiveUpdate.js';
import Device from '../models/Device.js';

export const getDeviceTimeline = async (req, res) => {
  try {
    const { imei } = req.params;
    const history = await UpdateHistory.find({ imei }).sort({ createdAt: -1 }).populate('updateId');
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const totalDevices = await UpdateHistory.countDocuments();
    const completedDevices = await UpdateHistory.countDocuments({ status: 'installation_completed' });
    const failedDevices = await UpdateHistory.countDocuments({ status: 'failed' });
    const rejectedDevices = await UpdateHistory.countDocuments({ status: 'rejected' });
    const pendingDevices = totalDevices - completedDevices - failedDevices - rejectedDevices;

    const successRate = totalDevices > 0 ? ((completedDevices / totalDevices) * 100).toFixed(2) : 0;
    const failureRate = totalDevices > 0 ? ((failedDevices / totalDevices) * 100).toFixed(2) : 0;
    const progress = totalDevices > 0 ? ((completedDevices / totalDevices) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalDevices,
        completedDevices,
        failedDevices,
        pendingDevices: Math.max(0, pendingDevices),
        successRate: parseFloat(successRate),
        failureRate: parseFloat(failureRate),
        progress: parseFloat(progress)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getRegionWiseAdoption = async (req, res) => {
  try {
    const devices = await Device.find();
    
    const regionMap = {};
    devices.forEach(device => {
      const region = device.region || 'Unknown';
      const version = device.currentVersion;
      
      if (!regionMap[region]) {
        regionMap[region] = {};
      }
      
      if (!regionMap[region][version]) {
        regionMap[region][version] = 0;
      }
      
      regionMap[region][version]++;
    });

    res.status(200).json({ success: true, data: regionMap });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getUpdateHistory = async (req, res) => {
  try {
    const history = await UpdateHistory.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('updateId');
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
