import React, { useState, useEffect } from 'react';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { ShieldAlert, Bell, Camera as CameraIcon, MapPin, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { safeRequestNotificationPermissions } from './nativePluginsHelper';

export default function NativePermissionsModal({ isOpen, onClose }) {
  const [permissionsState, setPermissionsState] = useState({
    location: 'prompt',
    camera: 'prompt',
    notifications: 'prompt',
  });
  const [loading, setLoading] = useState(false);

  const checkAllPermissions = async () => {
    try {
      // 1. Location permission check
      const locRes = await Geolocation.checkPermissions().catch(() => null);
      const locStatus = locRes?.location || 'prompt';

      // 2. Camera permission check
      const camRes = await Camera.checkPermissions().catch(() => null);
      const camStatus = camRes?.camera || 'prompt';

      // 3. Notification permission check
      let notifStatus = 'prompt';
      if (typeof window !== 'undefined' && 'Notification' in window) {
        notifStatus = Notification.permission;
      }

      setPermissionsState({
        location: locStatus,
        camera: camStatus,
        notifications: notifStatus,
      });
    } catch (e) {
      console.warn('[PermissionsCheck] Error checking permissions:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkAllPermissions();
    }
  }, [isOpen]);

  const requestPermission = async (type) => {
    setLoading(true);
    try {
      if (type === 'location') {
        const res = await Geolocation.requestPermissions().catch(() => null);
        if (res?.location === 'granted' || res?.coarseLocation === 'granted') {
          toast({ title: 'Location Access Granted', description: 'Coordinates can now be tagged to lost & found reports.' });
        }
      } else if (type === 'camera') {
        const res = await Camera.requestPermissions().catch(() => null);
        if (res?.camera === 'granted' || res?.photos === 'granted') {
          toast({ title: 'Camera & Media Granted', description: 'Item photos can now be captured and analyzed by AI.' });
        }
      } else if (type === 'notifications') {
        const res = await safeRequestNotificationPermissions();
        if (res === 'granted') {
          toast({ title: 'Notifications Enabled', description: 'You will receive real-time updates for AI match alerts.' });
        }
      }
      await checkAllPermissions();
    } catch (e) {
      console.warn(`[PermissionRequest] ${type} failed:`, e);
    } finally {
      setLoading(false);
    }
  };

  const requestAllPermissions = async () => {
    setLoading(true);
    await requestPermission('location');
    await requestPermission('camera');
    await requestPermission('notifications');
    setLoading(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const allGranted =
    permissionsState.location === 'granted' &&
    permissionsState.camera === 'granted' &&
    (permissionsState.notifications === 'granted' || permissionsState.notifications === 'default');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Decorative ambient gradient */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">App Permissions</h3>
              <p className="text-xs text-slate-400">Request access for optimal experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {/* 1. Location Permission Card */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Location Access</p>
                <p className="text-[11px] text-slate-400">Precise GPS coordinates for item spatial matching</p>
              </div>
            </div>
            {permissionsState.location === 'granted' ? (
              <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Granted
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => requestPermission('location')}
                disabled={loading}
                className="h-8 text-xs border-slate-600 hover:bg-slate-700 text-slate-200"
              >
                Allow
              </Button>
            )}
          </div>

          {/* 2. Camera & Photos Permission Card */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <CameraIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Camera & Media</p>
                <p className="text-[11px] text-slate-400">Capture photos for AI perceptual hash matching</p>
              </div>
            </div>
            {permissionsState.camera === 'granted' ? (
              <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Granted
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => requestPermission('camera')}
                disabled={loading}
                className="h-8 text-xs border-slate-600 hover:bg-slate-700 text-slate-200"
              >
                Allow
              </Button>
            )}
          </div>

          {/* 3. Notifications Permission Card */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Push Notifications</p>
                <p className="text-[11px] text-slate-400">Match alerts, claim status & handover codes</p>
              </div>
            </div>
            {permissionsState.notifications === 'granted' ? (
              <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Granted
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => requestPermission('notifications')}
                disabled={loading}
                className="h-8 text-xs border-slate-600 hover:bg-slate-700 text-slate-200"
              >
                Allow
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={requestAllPermissions}
            disabled={loading || allGranted}
            className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold text-sm shadow-lg shadow-blue-600/25"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {allGranted ? 'All Permissions Configured' : 'Grant All Permissions'}
          </Button>
        </div>
      </div>
    </div>
  );
}
