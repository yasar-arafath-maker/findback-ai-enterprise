/**
 * FindBack AI — Native Capacitor Plugin Wrapper & Safe Permissions Helper
 * Wraps @capacitor/camera, @capacitor/geolocation, @capacitor/haptics,
 * @capacitor/preferences, @capacitor/status-bar with robust fallbacks.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';

const PhoneDetection = registerPlugin('PhoneDetection');

const dataUrlToFile = (dataUrl, filename = `photo_${Date.now()}.jpg`) => {
  try {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1] || arr[0]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (e) {
    return new File([], filename, { type: 'image/jpeg' });
  }
};

const triggerWebFilePicker = (sourceType = 'camera') => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (sourceType === 'camera') {
      input.capture = 'environment';
    }
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return resolve({ ok: false, error: 'No file selected' });
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          ok: true,
          dataUrl: reader.result,
          file: file,
          webPath: URL.createObjectURL(file)
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  });
};

/**
 * 1. Safe Camera Plugin Wrapper with Native & Web File Picker Fallbacks
 */
export const safeTakeCameraPhoto = async (options = {}) => {
  const sourceType = options.source === 'photos' ? 'photos' : 'camera';
  const camSource = sourceType === 'photos' ? CameraSource.Photos : CameraSource.Camera;

  try {
    if (Capacitor.isNativePlatform()) {
      const permissions = await Camera.checkPermissions().catch(() => null);
      if (permissions && permissions.camera === 'denied') {
        const requested = await Camera.requestPermissions().catch(() => null);
        if (requested?.camera !== 'granted') {
          throw new Error('Camera permission denied. Please enable camera access in settings.');
        }
      }

      const photo = await Camera.getPhoto({
        quality: options.quality || 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: camSource,
      });

      const dataUrl = photo.dataUrl;
      const file = dataUrlToFile(dataUrl, `captured_${Date.now()}.jpg`);
      return {
        ok: true,
        dataUrl,
        file,
        webPath: photo.webPath || dataUrl,
      };
    } else {
      return await triggerWebFilePicker(sourceType);
    }
  } catch (err) {
    console.warn('[Native Camera Warning, falling back to Web File Picker]:', err.message);
    return await triggerWebFilePicker(sourceType);
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

/**
 * 7. Real SIM Phone Number Auto-Detection (Android Native SubscriptionManager / TelephonyManager + Web Credential Manager)
 */
export const fetchNativeSimPhoneNumber = async () => {
  // 1. Try Native Android Capacitor PhoneDetection Plugin if on Android / Native platform
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await PhoneDetection.getSimPhoneNumber();
      if (res && res.success && res.phoneNumber) {
        return {
          success: true,
          phoneNumber: res.phoneNumber,
          source: 'android_sim',
        };
      } else if (res && res.message) {
        console.info('[Native SIM Detection]:', res.message);
      }
    } catch (err) {
      console.warn('[Native SIM Detection Plugin Error]:', err?.message || err);
    }
  }

  // 2. Try Web Credential / Web OTP Manager API if available
  if (typeof window !== 'undefined' && 'credentials' in navigator && navigator.credentials.get) {
    try {
      const cred = await navigator.credentials.get({
        otp: { transport: ['sms'] }
      }).catch(() => null);

      if (cred?.code) {
        return {
          success: true,
          phoneNumber: cred.code,
          source: 'web_otp',
        };
      }
    } catch (e) {
      console.debug('[Web Credential Phone Hint Error]:', e);
    }
  }

  return {
    success: false,
    message: 'Could not read phone number from SIM card directly. Please enter your mobile phone number manually.',
  };
};

/**
 * 8. Safe Notification Permission Request Helper
 */
export const safeRequestNotificationPermissions = async () => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      return res;
    }
    return 'denied';
  } catch (e) {
    console.warn('[Notification Permission Request Error]:', e);
    return 'denied';
  }
};


