import { safeTakeCameraPhoto, safeGetCurrentLocation } from './nativePluginsHelper.js';

export const capturePhoto = async (opts) => {
  return await safeTakeCameraPhoto(opts);
};

export const getCurrentLocation = async () => {
  return await safeGetCurrentLocation();
};

export default {
  capturePhoto,
  getCurrentLocation
};
