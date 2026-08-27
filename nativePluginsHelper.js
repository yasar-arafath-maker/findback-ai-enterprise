/**
 * FindBack AI — Native Capacitor Plugin Wrapper & Safe Permissions Helper
 * Wraps @capacitor/camera, @capacitor/geolocation, @capacitor/haptics,
 * @capacitor/preferences, @capacitor/status-bar with robust fallbacks.
 */

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * 1. Safe Camera Plugin Wrapper
 */
export const safeTakeCameraPhoto = async () => {
  try {
    const permissions = await Camera.checkPermissions().catch(() => null);
    if (permissions && permissions.camera === 'denied') {
      const requested = await Camera.requestPermissions().catch(() => null);
      if (requested?.camera !== 'granted') {
        throw new Error('Camera permission denied. Please enable camera access in your device settings.');
      }
    }

    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });

    return photo.dataUrl;
  } catch (err) {
    console.warn('[Native Camera Warning]:', err.message);
    throw err;
  }
};

/**
 * 2. Safe Geolocation Plugin Wrapper
 */
export const safeGetCurrentLocation = async () => {
  try {
    const permissions = await Geolocation.checkPermissions().catch(() => null);
    if (permissions && permissions.location === 'denied') {
      const requested = await Geolocation.requestPermissions().catch(() => null);
      if (requested?.location !== 'granted') {
        throw new Error('Location permission denied. Please allow location access to tag report coordinates.');
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (err) {
    console.warn('[Native Location Warning]:', err.message);
    throw err;
  }
};

/**
 * 3. Safe Haptics Plugin Wrapper
 */
export const safeHapticImpact = async (style = ImpactStyle.Medium) => {
  try {
    await Haptics.impact({ style });
  } catch (err) {
    // Non-critical, ignore on unsupported web environments
  }
};

/**
 * 4. Safe Preferences Plugin Wrapper (Persistent Native Storage)
 */
export const safeStorage = {
  get: async (key) => {
    try {
      const res = await Preferences.get({ key });
      return res.value;
    } catch (e) {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
  },
  set: async (key, value) => {
    try {
      await Preferences.set({ key, value: String(value) });
    } catch (e) {}
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(key, String(value)); } catch (e) {}
    }
  },
  remove: async (key) => {
    try {
      await Preferences.remove({ key });
    } catch (e) {}
    if (typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(key); } catch (e) {}
    }
  }
};

/**
 * 5. Safe Status Bar Plugin Wrapper
 */
export const safeConfigureStatusBar = async (isDarkMode = true) => {
  try {
    await StatusBar.setStyle({
      style: isDarkMode ? Style.Dark : Style.Light,
    });
    await StatusBar.setBackgroundColor({
      color: isDarkMode ? '#0d0e12' : '#ffffff',
    });
  } catch (err) {
    // Non-critical for web
  }
};
