/**
 * Convert semantic version string to numeric code for comparison.
 * Format: major*10000 + minor*100 + patch
 * Examples: "4.3.1" → 40301, "4.3" → 40300, "5.0.0" → 50000
 */
function versionToCode(version) {
  if (!version && version !== 0) return 0;
  if (typeof version === 'number') return version;
  try {
    const str = String(version).trim();
    const parts = str.split('.').map(p => parseInt(p.replace(/[^0-9]/g, ''), 10) || 0);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;
    return major * 10000 + minor * 100 + patch;
  } catch (e) {
    return 0;
  }
}

/**
 * Convert numeric code back to version string.
 * Example: 40301 → "4.3.1"
 */
function codeToVersion(code) {
  if (!code || typeof code !== 'number') return '0.0.0';
  const major = Math.floor(code / 10000);
  const minor = Math.floor((code % 10000) / 100);
  const patch = code % 100;
  return `${major}.${minor}.${patch}`;
}

module.exports = { versionToCode, codeToVersion };
