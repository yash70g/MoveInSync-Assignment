import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const sendHeartbeat = async (deviceData) => {
  try {
    const response = await api.post('/devices/heartbeat', deviceData);
    return response.data;
  } catch (error) {
    console.error('Heartbeat error:', error);
    throw error;
  }
};

export const getAllDevices = async () => {
  try {
    const response = await api.get('/devices');
    return response.data;
  } catch (error) {
    console.error('Get devices error:', error);
    throw error;
  }
};

export const rejectUpdate = async (imei, updateId) => {
  try {
    const response = await api.post('/devices/reject-update', { imei, updateId });
    return response.data;
  } catch (error) {
    console.error('Reject update error:', error);
    throw error;
  }
};

export default api;
