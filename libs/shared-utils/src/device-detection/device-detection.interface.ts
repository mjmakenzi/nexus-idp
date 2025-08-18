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

// Security Analysis Interfaces
export interface TimingAnalysis {
  timeSinceLastRequest: number; // milliseconds
  requestFrequency: 'normal' | 'high' | 'suspicious';
  isAutomated: boolean;
  riskScore: number; // 0-1
}

export interface UserAgentAnalysis {
  isMissing: boolean;
  isTooShort: boolean;
  isTooLong: boolean;
  hasSuspiciousKeywords: boolean;
  hasRandomPatterns: boolean;
  isAutomated: boolean;
  consistencyScore: number; // 0-1
  riskScore: number; // 0-1
  isSuspicious: boolean;
}

export interface HeaderAnalysis {
  inconsistencies: string[];
  consistencyScore: number; // 0-1
  isConsistent: boolean;
}

export interface GeographicAnalysis {
  country: string;
  city: string;
  isKnownLocation: boolean;
  isSuspiciousLocation: boolean;
  riskScore: number; // 0-1
}

export interface NetworkAnalysis {
  isProxy: boolean;
  isVPN: boolean;
  isDatacenter: boolean;
  isSuspiciousISP: boolean;
  reputationScore: number; // 0-1
  riskScore: number; // 0-1
}

export interface SecurityAnalyses {
  timingAnalysis: TimingAnalysis;
  userAgentAnalysis: UserAgentAnalysis;
  headerAnalysis: HeaderAnalysis;
  geographicAnalysis: GeographicAnalysis;
  networkAnalysis: NetworkAnalysis;
}

export interface SecurityAnalysis {
  securityScore: number; // 0-1 overall risk score
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suspiciousPatterns: string[];
  recommendations: string[];
  analysis: SecurityAnalyses;
}
