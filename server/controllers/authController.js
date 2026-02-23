import User from '../models/User.js';

export const register = async (req, res) => {
  try {
    const { username, pin, role } = req.body;

    if (!username || !pin) return res.status(400).json({ success: false, message: 'Username and PIN required' });
    if (!/^\d{4}$/.test(pin)) return res.status(400).json({ success: false, message: 'PIN must be 4 digits' });
    if (await User.findOne({ username })) return res.status(400).json({ success: false, message: 'Username already exists' });

    const user = await User.create({ username, pin, role: role || 'client' });
    res.status(201).json({ success: true, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, pin } = req.body;

    if (!username || !pin) return res.status(400).json({ success: false, message: 'Username and PIN required' });

    const user = await User.findOne({ username });
    if (!user || user.pin !== pin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    res.status(200).json({ success: true, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
