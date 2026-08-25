import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

/**
 * Utility to convert base64 / dataUrl into a standard JS File object
 */
export function dataUrlToFile(dataUrl, filename = `capture_${Date.now()}.jpg`) {
  try {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (err) {
    console.error('Failed to convert dataUrl to File:', err);
    return null;
  }
}

/**
 * Native & Web Photo Capture Wrapper
 * Supports native camera / gallery via Capacitor and falls back cleanly for browser environments.
 * Handles permission denial and cancellation without throwing unhandled exceptions.
 * @param {object} options { source: 'camera' | 'photos', quality: number }
 * @returns {Promise<{ file: File | null, dataUrl: string | null, source: string, error?: string, cancelled?: boolean }>}
 */
export async function capturePhoto(options = {}) {
  const isNative = Capacitor.isNativePlatform();
  const source = options.source === 'photos' ? CameraSource.Photos : CameraSource.Camera;

  // 1. Try Native Capacitor Camera
  try {
    if (isNative || (typeof Camera !== 'undefined' && Camera.getPhoto)) {
      try {
        const permissions = await Camera.checkPermissions();
        if (permissions.camera !== 'granted' && permissions.photos !== 'granted') {
          await Camera.requestPermissions();
        }
      } catch (permErr) {
        console.warn('Camera permission check warning:', permErr);
      }

      const photo = await Camera.getPhoto({
        quality: options.quality || 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source,
      });

      if (photo && photo.dataUrl) {
        const file = dataUrlToFile(photo.dataUrl, `photo_${Date.now()}.${photo.format || 'jpg'}`);
        return {
          file,
          dataUrl: photo.dataUrl,
          source: isNative ? 'native_capacitor' : 'web_camera',
          format: photo.format,
        };
      }
    }
  } catch (err) {
    console.warn('Capacitor Camera capture failed or cancelled:', err);
    if (err.message && err.message.toLowerCase().includes('cancelled')) {
      return { file: null, dataUrl: null, cancelled: true };
    }
  }

  // 2. Browser Fallback: HTML5 File Input
  return new Promise((resolve) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (options.source === 'camera') {
        input.capture = 'environment';
      }

      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              file,
              dataUrl: event.target?.result || null,
              source: 'web_file_picker',
            });
          };
          reader.onerror = () => {
            resolve({ file, dataUrl: null, source: 'web_file_picker' });
          };
          reader.readAsDataURL(file);
        } else {
          resolve({ file: null, dataUrl: null, cancelled: true });
        }
      };

      input.onerror = () => {
        resolve({ file: null, dataUrl: null, error: 'File selection failed' });
      };

      input.click();
    } catch (fallbackErr) {
      resolve({ file: null, dataUrl: null, error: fallbackErr.message || 'Browser camera unavailable' });
    }
  });
}

/**
 * Native & Web Device Geolocation Wrapper
 * Captures latitude, longitude, and accuracy using Capacitor Geolocation or HTML5 Geolocation.
 * Handles permission prompt & denial states gracefully without throwing unhandled exceptions.
 * @returns {Promise<{ latitude: number | null, longitude: number | null, accuracy: number | null, source: string, error?: string }>}
 */
export async function getCurrentLocation() {
  const isNative = Capacitor.isNativePlatform();

  // 1. Try Capacitor Geolocation
  try {
    if (isNative || (typeof Geolocation !== 'undefined' && Geolocation.getCurrentPosition)) {
      try {
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted') {
          await Geolocation.requestPermissions();
        }
      } catch (permErr) {
        console.warn('Geolocation permission check warning:', permErr);
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      });

      if (position && position.coords) {
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || null,
          source: isNative ? 'native_capacitor_gps' : 'web_capacitor_gps',
        };
      }
    }
  } catch (err) {
    console.warn('Capacitor Geolocation error, attempting browser fallback:', err);
  }

  // 2. Browser Fallback: navigator.geolocation
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || null,
            source: 'browser_navigator_gps',
          });
        },
        (error) => {
          console.warn('Browser geolocation error:', error);
          let errorMsg = 'Geolocation error';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Location permission denied by user';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'Location information unavailable';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Location request timed out';
          }
          resolve({
            latitude: null,
            longitude: null,
            accuracy: null,
            source: 'none',
            error: errorMsg,
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    });
  }

  return {
    latitude: null,
    longitude: null,
    accuracy: null,
    source: 'none',
    error: 'Geolocation services not supported on this device',
  };
}
