import Version from '../models/Version.js';

export const registerVersion = async (req, res) => {
  try {
    const { versionString, versionCode, checksum } = req.body;

    if (!versionString || versionCode === undefined || !checksum) {
      return res.status(400).json({ success: false, message: 'Version string, version code, and checksum are required' });
    }

    const existingVersion = await Version.findOne({ $or: [{ versionString }, { versionCode }] });
    if (existingVersion) {
      return res.status(400).json({ success: false, message: 'Version string or version code already exists' });
    }

    const version = await Version.create({ versionString, versionCode, checksum });
    res.status(201).json({ success: true, message: 'Version registered successfully', data: version });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getAllVersions = async (req, res) => {
  try {
    const versions = await Version.find().sort({ versionCode: -1 });
    res.status(200).json({ success: true, count: versions.length, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getVersionHierarchy = async (req, res) => {
  try {
    const oldCodeNum = parseInt(req.params.oldCode);
    const newCodeNum = parseInt(req.params.newCode);

    if (oldCodeNum >= newCodeNum) {
      return res.status(400).json({ success: false, message: 'Old version code must be less than new version code' });
    }

    const versions = await Version.find({ versionCode: { $gt: oldCodeNum, $lte: newCodeNum } }).sort({ versionCode: 1 });
    res.status(200).json({ success: true, hierarchyOrder: versions.map(v => v.versionCode), versions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const deleteVersion = async (req, res) => {
  try {
    const version = await Version.findByIdAndDelete(req.params.id);
    if (!version) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }
    res.status(200).json({ success: true, message: 'Version deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
