export const generateIMEI = () => {
  const stored = localStorage.getItem('device_imei');
  if (stored) return stored;

  const imei = Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
  localStorage.setItem('device_imei', imei);
  return imei;
};

export const getRegion = () => {
  return localStorage.getItem('device_region') || 'Bangaloore';
};

export const getAppVersion = () => {
  const stored = localStorage.getItem('device_version');
  if (stored) return stored;
  const defaultVersion = '1.0.0';
  localStorage.setItem('device_version', defaultVersion);
  return defaultVersion;
};

export const getDeviceInfo = () => {
  return {
    imei: generateIMEI(),
    region: getRegion(),
    currentVersion: getAppVersion(),
    lastHeartbeat: new Date().toISOString()
  };
};
