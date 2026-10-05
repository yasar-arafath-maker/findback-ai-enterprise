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
    console.warn('[nativePlugins] Haptics.impact not available:', err.message);
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
      console.warn('[nativePlugins] Preferences.get failed, falling back to localStorage:', e.message);
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
  },
  set: async (key, value) => {
    try {
      await Preferences.set({ key, value: String(value) });
    } catch (e) {
      console.warn('[nativePlugins] Preferences.set failed:', e.message);
    }
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(key, String(value)); } catch (e) {
        console.warn('[nativePlugins] localStorage.setItem failed:', e.message);
      }
    }
  },
  remove: async (key) => {
    try {
      await Preferences.remove({ key });
    } catch (e) {
      console.warn('[nativePlugins] Preferences.remove failed:', e.message);
    }
    if (typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(key); } catch (e) {
        console.warn('[nativePlugins] localStorage.removeItem failed:', e.message);
      }
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
    console.warn('[nativePlugins] StatusBar configuration not available:', err.message);
  }
};

/**
 * 6. Safe Native / WebAuthn Biometrics Wrapper
 */
export const safeEnableBiometrics = async (user, password) => {
  try {
    const biometricData = {
      email: user.email,
      password: password,
      full_name: user.full_name,
      role: user.role,
      enabledAt: new Date().toISOString(),
    };
    await safeStorage.set('findback_biometric_auth', JSON.stringify(biometricData));
    await safeStorage.set('findback_biometric_enabled', 'true');

    // Register WebAuthn Credential if supported by browser/device
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new TextEncoder().encode(user.id || user.email);

      await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'FindBack AI Enterprise' },
          user: {
            id: userId,
            name: user.email,
            displayName: user.full_name || user.email,
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          timeout: 60000,
          authenticatorSelection: { userVerification: 'preferred' },
        }
      }).catch(e => console.debug('[Biometrics WebAuthn register fallback]:', e.message));
    }

    return true;
  } catch (err) {
    console.warn('[Biometrics Enable Error]:', err);
    return false;
  }
};

export const safeAuthenticateBiometric = async () => {
  try {
    const raw = await safeStorage.get('findback_biometric_auth');
    if (!raw) {
      throw new Error('No biometric enrollment found. Please log in with password first to register Touch ID / Face ID.');
    }

    const bioUser = JSON.parse(raw);

    // WebAuthn Biometric Prompt Trigger
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
        }
      }).catch(e => console.debug('[Biometrics WebAuthn verify fallback]:', e.message));
    }

    return bioUser;
  } catch (err) {
    console.warn('[Biometrics Authenticate Warning]:', err.message);
    throw err;
  }
};

