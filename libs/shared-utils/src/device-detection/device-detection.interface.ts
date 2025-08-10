import { DeviceType } from '@app/db';

export interface ParsedUserAgent {
  browser: {
    name: string;
    version: string;
    major: string;
  };
  os: {
    name: string;
    version: string;
  };
  device: {
    type: DeviceType;
    vendor?: string;
    model?: string;
  };
  engine: {
    name: string;
    version: string;
  };
}

export interface DeviceFingerprint {
  primary: string; // Main fingerprint for identification
  secondary: string; // Backup fingerprint
  components: {
    userAgent: string;
    screen?: string;
    timezone?: string;
    language?: string;
    platform?: string;
    webgl?: string;
    canvas?: string;
    // Mobile app specific headers
    deviceId?: string; // UUID from mobile app
    deviceModel?: string; // iPhone14,2, Samsung SM-G998B, etc.
    deviceName?: string; // User-friendly name: "John's iPhone", "Work Laptop"
    systemVersion?: string; // iOS 17.2, Android 13
    appVersion?: string; // App version
    appBuild?: string; // Build number
    deviceCapabilities?: string; // Hardware capabilities
  };
  confidence: 'high' | 'medium' | 'low';
  validation: {
    isMobileApp: boolean;
    hasDeviceId: boolean;
    hasHardwareInfo: boolean;
    isConsistent: boolean;
  };
}
