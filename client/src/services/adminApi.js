import api from './api.js';

export const registerVersion = async (versionData) => {
  const response = await api.post('/versions', versionData);
  return response.data;
};

export const getAllVersions = async () => {
  const response = await api.get('/versions');
  return response.data;
};

export const getVersionHierarchy = async (oldCode, newCode) => {
  const response = await api.get(`/versions/hierarchy/${oldCode}/${newCode}`);
  return response.data;
};

export const deleteVersion = async (versionId) => {
  const response = await api.delete(`/versions/${versionId}`);
  return response.data;
};

export const createLiveUpdate = async (updateData) => {
  const response = await api.post('/live-updates', updateData);
  return response.data;
};

export const getAllLiveUpdates = async () => {
  const response = await api.get('/live-updates');
  return response.data;
};

export const getFilteredDevices = async (region, version) => {
  const response = await api.get('/live-updates/devices', { params: { region, version } });
  return response.data;
};

export const deleteLiveUpdate = async (updateId) => {
  const response = await api.delete(`/live-updates/${updateId}`);
  return response.data;
};
