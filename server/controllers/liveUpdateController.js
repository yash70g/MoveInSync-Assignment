import LiveUpdate from '../models/LiveUpdate.js';
import Device from '../models/Device.js';
import Version from '../models/Version.js';

export const createLiveUpdate = async (req, res) => {
  try {
    const { region, oldVersion, newVersion, deviceIds } = req.body;

    if (!oldVersion || !newVersion || !deviceIds || deviceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Old version, new version, and device IDs are required' });
    }

    const oldVersionDoc = await Version.findOne({ versionString: oldVersion });
    const newVersionDoc = await Version.findOne({ versionString: newVersion });

    if (!oldVersionDoc || !newVersionDoc) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }

    if (oldVersionDoc.versionCode >= newVersionDoc.versionCode) {
      return res.status(400).json({ success: false, message: 'New version must be greater than old version' });
    }

    const hierarchyVersions = await Version.find({
      versionCode: { $gt: oldVersionDoc.versionCode, $lte: newVersionDoc.versionCode }
    }).sort({ versionCode: 1 });

    const hierarchyOrder = hierarchyVersions.map(v => v.versionCode);

    const liveUpdate = await LiveUpdate.create({
      region: region || null,
      oldVersion,
      newVersion,
      hierarchyOrder,
      pendingCount: deviceIds.length,
      completedCount: 0,
      targetDevices: deviceIds
    });

    res.status(201).json({ success: true, message: 'Live update created successfully', data: liveUpdate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getAllLiveUpdates = async (req, res) => {
  try {
    const liveUpdates = await LiveUpdate.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: liveUpdates.length, data: liveUpdates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getLiveUpdateById = async (req, res) => {
  try {
    const liveUpdate = await LiveUpdate.findById(req.params.id);
    if (!liveUpdate) {
      return res.status(404).json({ success: false, message: 'Live update not found' });
    }
    res.status(200).json({ success: true, data: liveUpdate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const deleteLiveUpdate = async (req, res) => {
  try {
    const liveUpdate = await LiveUpdate.findByIdAndDelete(req.params.id);
    if (!liveUpdate) {
      return res.status(404).json({ success: false, message: 'Live update not found' });
    }
    res.status(200).json({ success: true, message: 'Live update deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getFilteredDevices = async (req, res) => {
  try {
    const { region, version } = req.query;
    const filter = {};
    
    if (region && region !== 'all') filter.region = region;
    if (version && version !== 'all') filter.currentVersion = version;

    const devices = await Device.find(filter).sort({ lastHeartbeat: -1 });
    res.status(200).json({ success: true, count: devices.length, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
