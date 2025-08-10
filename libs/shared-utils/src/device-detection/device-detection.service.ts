import { Injectable } from '@nestjs/common';
import { DeviceType } from '@app/db';
import { createHash } from 'crypto';
import { FastifyRequest } from 'fastify';
import {
  DeviceFingerprint,
  ParsedUserAgent,
} from './device-detection.interface';

@Injectable()
export class DeviceDetectionService {
  /**
   * BEST PRACTICE: Parse user agent once and extract all information
   * This is more efficient and provides comprehensive device info
   */
  parseUserAgent(userAgent: string): ParsedUserAgent {
    const ua = userAgent.toLowerCase();

    // Parse browser information
    const browser = this.extractBrowserInfo(ua, userAgent);

    // Parse OS information
    const os = this.extractOSInfo(ua);

    // Determine device type
    const device = this.extractDeviceInfo(ua, browser, os);

    // Parse engine information
    const engine = this.extractEngineInfo(ua);

    return { browser, os, device, engine };
  }

  /**
   * BEST PRACTICE: Multi-layer device fingerprinting
   * Combines multiple data sources for robust identification
   */
  generateDeviceFingerprint(req: FastifyRequest): DeviceFingerprint {
    const userAgent = req.headers['user-agent'] || '';
    const parsed = this.parseUserAgent(userAgent);

    // Collect fingerprint components with mobile app headers
    const components = {
      userAgent,
      screen: req.headers['x-screen-resolution'] as string,
      timezone: req.headers['x-timezone'] as string,
      language: req.headers['accept-language'] as string,
      platform: req.headers['sec-ch-ua-platform'] as string,
      webgl: req.headers['x-webgl-vendor'] as string,
      canvas: req.headers['x-canvas-fingerprint'] as string,
      // Mobile app specific headers
      deviceId: req.headers['x-device-id'] as string,
      deviceModel: req.headers['x-device-model'] as string,
      deviceName: this.decodeDeviceName(req.headers['x-device-name'] as string), // Decode Base64 device name
      systemVersion: req.headers['x-system-version'] as string,
      appVersion: req.headers['x-app-version'] as string,
      appBuild: req.headers['x-app-build'] as string,
      deviceCapabilities: req.headers['x-device-capabilities'] as string,
    };

    // Generate primary fingerprint
    const primary = this.createPrimaryFingerprint(components, parsed);

    // Generate secondary fingerprint (fallback)
    const secondary = this.createSecondaryFingerprint(components, parsed);

    // Determine confidence level
    const confidence = this.calculateConfidence(components);

    // Validate device information
    const validation = this.validateDeviceInfo(components, parsed);

    return {
      primary,
      secondary,
      components,
      confidence,
      validation,
    };
  }

  /**
   * BROWSER DETECTION: Comprehensive and accurate
   */
  private extractBrowserInfo(
    ua: string,
    originalUA: string,
  ): ParsedUserAgent['browser'] {
    // Check if this is a mobile app first (to avoid misclassification)
    if (this.isMobileAppUserAgent(originalUA)) {
      const mobileMatch = originalUA.match(
        /^([^\/]+)\/([^\s]+)\s*\((?:([^;]+);)?([^;\s]+)\s+([^;]+);([^)]+)\)$/,
      );
      if (mobileMatch) {
        return {
          name: mobileMatch[1] || 'Mobile App',
          version: mobileMatch[2] || '1.0.0',
          major: mobileMatch[2]?.split('.')[0] || '1',
        };
      }
    }

    // Modern Chrome/Chromium
    if (ua.includes('chrome/') && !ua.includes('edg/')) {
      const match = ua.match(/chrome\/(\d+)\.(\d+)\.(\d+)/);
      return {
        name: 'Chrome',
        version: match ? `${match[1]}.${match[2]}.${match[3]}` : '',
        major: match ? match[1] : '',
      };
    }

    // Microsoft Edge
    if (ua.includes('edg/')) {
      const match = ua.match(/edg\/(\d+)\.(\d+)\.(\d+)/);
      return {
        name: 'Edge',
        version: match ? `${match[1]}.${match[2]}.${match[3]}` : '',
        major: match ? match[1] : '',
      };
    }

    // Safari
    if (ua.includes('safari/') && !ua.includes('chrome/')) {
      const match = ua.match(/version\/(\d+)\.(\d+)\.?(\d+)?/);
      return {
        name: 'Safari',
        version: match ? `${match[1]}.${match[2]}.${match[3] || '0'}` : '',
        major: match ? match[1] : '',
      };
    }

    // Firefox
    if (ua.includes('firefox/')) {
      const match = ua.match(/firefox\/(\d+)\.(\d+)\.?(\d+)?/);
      return {
        name: 'Firefox',
        version: match ? `${match[1]}.${match[2]}.${match[3] || '0'}` : '',
        major: match ? match[1] : '',
      };
    }

    // Opera
    if (ua.includes('opera/') || ua.includes('opr/')) {
      const match = ua.match(/(?:opera|opr)\/(\d+)\.(\d+)\.?(\d+)?/);
      return {
        name: 'Opera',
        version: match ? `${match[1]}.${match[2]}.${match[3] || '0'}` : '',
        major: match ? match[1] : '',
      };
    }

    // Internet Explorer
    if (ua.includes('msie ') || ua.includes('trident/')) {
      const match = ua.match(/msie (\d+)\.(\d+)/);
      return {
        name: 'Internet Explorer',
        version: match ? `${match[1]}.${match[2]}` : '',
        major: match ? match[1] : '',
      };
    }

    return { name: 'Unknown', version: '', major: '' };
  }

  /**
   * CHECK MOBILE APP USER AGENT: Helper to identify mobile app User-Agents
   */
  private isMobileAppUserAgent(userAgent: string): boolean {
    if (!userAgent) return false;

    // Mobile app specific patterns
    const mobileAppPatterns = [
      /^[A-Za-z0-9_-]+\/\d+\.\d+\.\d+ \(iOS \d+\.\d+;[A-F0-9-]+\)$/, // iOS app
      /^[A-Za-z0-9_-]+\/\d+\.\d+\.\d+ \(Android \d+;[A-F0-9-]+\)$/, // Android app
      /ArzdigitalApp/, // Your specific app
      /Mobile App/, // Generic mobile app
    ];

    return mobileAppPatterns.some((pattern) => pattern.test(userAgent));
  }

  /**
   * OS DETECTION: Accurate cross-platform detection
   */
  private extractOSInfo(ua: string): ParsedUserAgent['os'] {
    // Windows
    if (ua.includes('windows nt')) {
      const match = ua.match(/windows nt (\d+)\.(\d+)/);
      const version = match ? `${match[1]}.${match[2]}` : '';
      return { name: 'Windows', version };
    }

    // macOS
    if (ua.includes('mac os x') || ua.includes('macos')) {
      const match = ua.match(/mac os x (\d+)[_.](\d+)[_.]?(\d+)?/);
      const version = match ? `${match[1]}.${match[2]}.${match[3] || '0'}` : '';
      return { name: 'macOS', version };
    }

    // Enhanced mobile app detection - Check for mobile app patterns first
    if (this.isMobileAppUserAgent(ua)) {
      // Try to extract OS from mobile app User-Agent patterns
      const mobileAppMatch = ua.match(/\(([^;]+);([^)]+)\)/);
      if (mobileAppMatch && mobileAppMatch[1]) {
        const osInfo = mobileAppMatch[1].trim();

        // iOS pattern: "iOS 17.2"
        const iosMatch = osInfo.match(/ios\s+(\d+)[_.](\d+)[_.]?(\d+)?/i);
        if (iosMatch) {
          const version = `${iosMatch[1]}.${iosMatch[2]}.${iosMatch[3] || '0'}`;
          return { name: 'iOS', version };
        }

        // Android pattern: "Android 13"
        const androidMatch = osInfo.match(
          /android\s+(\d+)[_.]?(\d+)?[_.]?(\d+)?/i,
        );
        if (androidMatch) {
          const version = `${androidMatch[1]}.${androidMatch[2] || '0'}.${androidMatch[3] || '0'}`;
          return { name: 'Android', version };
        }
      }
    }

    // iOS - Standard detection
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
      // Try multiple patterns for iOS detection
      let match = ua.match(/os (\d+)[_.](\d+)[_.]?(\d+)?/i); // Standard iOS pattern
      if (!match) {
        match = ua.match(/ios (\d+)[_.](\d+)[_.]?(\d+)?/i); // Direct iOS pattern
      }
      if (!match) {
        match = ua.match(/\(([^;]+);([^)]+)\)/); // Mobile app pattern
        if (match && match[1]) {
          // Extract OS from mobile app format: "iOS 17.2"
          const osMatch = match[1].match(
            /(ios|android)\s+(\d+)[_.](\d+)[_.]?(\d+)?/i,
          );
          if (osMatch) {
            const version = `${osMatch[2]}.${osMatch[3]}.${osMatch[4] || '0'}`;
            const deviceName =
              osMatch[1].toLowerCase() === 'ios' ? 'iOS' : 'Android';
            return { name: deviceName, version };
          }
        }
      }

      const version = match ? `${match[1]}.${match[2]}.${match[3] || '0'}` : '';
      const deviceName = ua.includes('ipad') ? 'iPadOS' : 'iOS';
      return { name: deviceName, version };
    }

    // Android - Standard detection
    if (ua.includes('android')) {
      const match = ua.match(/android (\d+)\.?(\d+)?\.?(\d+)?/);
      const version = match
        ? `${match[1]}.${match[2] || '0'}.${match[3] || '0'}`
        : '';
      return { name: 'Android', version };
    }

    // Linux
    if (ua.includes('linux')) {
      return { name: 'Linux', version: '' };
    }

    return { name: 'Unknown', version: '' };
  }

  /**
   * DEVICE TYPE DETECTION: Accurate device categorization
   */
  private extractDeviceInfo(
    ua: string,
    browser: ParsedUserAgent['browser'],
    os: ParsedUserAgent['os'],
  ): ParsedUserAgent['device'] {
    // Tablet detection
    if (
      ua.includes('ipad') ||
      (ua.includes('android') && ua.includes('tablet'))
    ) {
      return { type: DeviceType.TABLET };
    }

    // Mobile detection - Enhanced for mobile apps
    if (
      ua.includes('mobile') ||
      ua.includes('ArzdigitalApp') ||
      ua.includes('iphone') ||
      ua.includes('ios') ||
      (ua.includes('android') && !ua.includes('tablet')) ||
      browser.name === 'Mobile App' ||
      browser.name === 'ArzdigitalApp' ||
      os.name === 'iOS' ||
      os.name === 'Android'
    ) {
      return { type: DeviceType.MOBILE };
    }

    // Desktop detection
    if (['Windows', 'macOS', 'Linux'].includes(os.name)) {
      return { type: DeviceType.DESKTOP };
    }

    return { type: DeviceType.UNKNOWN };
  }

  /**
   * ENGINE DETECTION: Browser engine information
   */
  private extractEngineInfo(ua: string): ParsedUserAgent['engine'] {
    if (ua.includes('webkit/')) {
      const match = ua.match(/webkit\/(\d+)\.(\d+)/);
      return {
        name: 'WebKit',
        version: match ? `${match[1]}.${match[2]}` : '',
      };
    }

    if (ua.includes('gecko/')) {
      const match = ua.match(/gecko\/(\d+)/);
      return {
        name: 'Gecko',
        version: match ? match[1] : '',
      };
    }

    return { name: 'Unknown', version: '' };
  }

  /**
   * PRIMARY FINGERPRINT: Most reliable identification
   */
  private createPrimaryFingerprint(
    components: DeviceFingerprint['components'],
    parsed: ParsedUserAgent,
  ): string {
    // PRIORITY 1: Use device ID from mobile app headers (most reliable)
    if (components.deviceId && this.isValidUUID(components.deviceId)) {
      return components.deviceId;
    }

    // PRIORITY 2: Extract from user agent if it's a mobile app
    const mobileMatch = components.userAgent.match(
      /^([^\/]+)\/([^\s]+)\s*\((?:([^;]+);)?([^;\s]+)\s+([^;]+);([^)]+)\)$/,
    );
    if (mobileMatch && mobileMatch[6] && this.isValidUUID(mobileMatch[6])) {
      return mobileMatch[6]; // Use the unique ID from mobile app user agent
    }

    // PRIORITY 3: Create composite fingerprint for browsers or fallback
    const fingerprintData = [
      components.userAgent,
      components.screen || '',
      components.timezone || '',
      components.language?.split(',')[0] || '',
      components.platform || '',
      components.deviceModel || '',
      components.systemVersion || '',
      `${parsed.os.name}${parsed.os.version}`,
      `${parsed.browser.name}${parsed.browser.major}`,
    ].join('|');

    return createHash('sha256')
      .update(fingerprintData)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * SECONDARY FINGERPRINT: Fallback identification
   */
  private createSecondaryFingerprint(
    components: DeviceFingerprint['components'],
    parsed: ParsedUserAgent,
  ): string {
    const basicData = [
      components.userAgent,
      components.language?.split(',')[0] || '',
      parsed.os.name,
      parsed.browser.name,
    ].join('|');

    return createHash('md5').update(basicData).digest('hex');
  }

  /**
   * CONFIDENCE CALCULATION: Assess fingerprint reliability
   */
  private calculateConfidence(
    components: DeviceFingerprint['components'],
  ): 'high' | 'medium' | 'low' {
    let score = 0;

    // Basic components
    if (components.userAgent) score += 2;
    if (components.screen) score += 2;
    if (components.timezone) score += 1;
    if (components.language) score += 1;
    if (components.platform) score += 1;
    if (components.webgl) score += 2;
    if (components.canvas) score += 2;

    // Mobile app specific components (higher weight for security)
    if (components.deviceId) score += 5; // UUID is very reliable
    if (components.deviceModel) score += 3;
    if (components.systemVersion) score += 2;
    if (components.appVersion) score += 2;
    if (components.appBuild) score += 1;
    if (components.deviceCapabilities) score += 3;

    if (score >= 12) return 'high';
    if (score >= 8) return 'medium';
    return 'low';
  }

  /**
   * VALIDATION: Verify device information consistency and authenticity
   */
  private validateDeviceInfo(
    components: DeviceFingerprint['components'],
    parsed: ParsedUserAgent,
  ): DeviceFingerprint['validation'] {
    const isMobileApp =
      parsed.browser.name === 'Mobile App' ||
      components.userAgent.includes('ArzdigitalApp');

    const hasDeviceId =
      !!components.deviceId && this.isValidUUID(components.deviceId);

    const hasHardwareInfo = !!(
      components.deviceModel || components.deviceCapabilities
    );

    const isConsistent = this.checkConsistency(components, parsed);

    return {
      isMobileApp,
      hasDeviceId,
      hasHardwareInfo,
      isConsistent,
    };
  }

  /**
   * UUID VALIDATION: Verify device ID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * CONSISTENCY CHECK: Verify data consistency across sources
   */
  private checkConsistency(
    components: DeviceFingerprint['components'],
    parsed: ParsedUserAgent,
  ): boolean {
    // Check OS consistency
    if (components.systemVersion && parsed.os.version) {
      const systemOS = components.systemVersion.split(' ')[0]; // "iOS 17.2" -> "iOS"
      if (systemOS !== parsed.os.name) {
        console.warn('OS inconsistency detected', {
          userAgentOS: parsed.os.name,
          headerOS: systemOS,
        });
        return false;
      }
    }

    // Check app version consistency
    if (components.appVersion && parsed.browser.version) {
      if (components.appVersion !== parsed.browser.version) {
        console.warn('App version inconsistency detected', {
          userAgentVersion: parsed.browser.version,
          headerVersion: components.appVersion,
        });
        return false;
      }
    }

    // Check device model format
    if (components.deviceModel) {
      const isValidModel = this.isValidDeviceModel(components.deviceModel);
      if (!isValidModel) {
        console.warn('Invalid device model format', {
          model: components.deviceModel,
        });
        return false;
      }
    }

    return true;
  }

  /**
   * DEVICE MODEL VALIDATION: Verify device model format
   */
  private isValidDeviceModel(model: string): boolean {
    // iPhone format: iPhone14,2, iPhone15,1, etc.
    const iPhoneRegex = /^iPhone\d+,\d+$/;

    // Android format: Samsung SM-G998B, Google Pixel 7, etc.
    const androidRegex = /^[A-Za-z\s]+[A-Z0-9-]+$/;

    return iPhoneRegex.test(model) || androidRegex.test(model);
  }

  /**
   * UTILITY: Get all device information at once with header-first mobile app support
   */
  getCompleteDeviceInfo(req: FastifyRequest) {
    const userAgent = req.headers['user-agent'] || '';
    const fingerprint = this.generateDeviceFingerprint(req);

    // Check if this is a mobile app based on headers first
    const isMobileAppByHeaders = this.isMobileAppByHeaders(
      fingerprint.components,
    );

    if (isMobileAppByHeaders) {
      // HEADER-FIRST APPROACH: Use headers as primary source for mobile apps
      return this.getMobileAppDeviceInfo(fingerprint, userAgent, req);
    } else {
      // USER-AGENT APPROACH: Use traditional parsing for browsers
      const parsed = this.parseUserAgent(userAgent);
      return this.getBrowserDeviceInfo(fingerprint, parsed, userAgent, req);
    }
  }

  /**
   * HEADER-FIRST: Get device info for mobile apps using headers as primary source
   */
  private getMobileAppDeviceInfo(
    fingerprint: DeviceFingerprint,
    userAgent: string,
    req: FastifyRequest,
  ) {
    const components = fingerprint.components;

    // Extract OS info from headers first, then fallback to User-Agent
    let osName = 'Unknown';
    let osVersion = '';

    // Try headers first
    if (components.systemVersion) {
      const systemMatch = components.systemVersion.match(
        /(ios|android)\s+(\d+[.\d]*)/i,
      );
      if (systemMatch) {
        osName = systemMatch[1].toLowerCase() === 'ios' ? 'iOS' : 'Android';
        osVersion = systemMatch[2];
      }
    }

    // Fallback to User-Agent parsing if headers didn't provide OS info
    if (osName === 'Unknown' && userAgent) {
      const parsed = this.parseUserAgent(userAgent);
      osName = parsed.os.name;
      osVersion = parsed.os.version;
    }

    // Extract device name with priority
    let deviceName = '';
    if (components.deviceName) {
      deviceName = components.deviceName; // User-friendly name first
    } else if (components.deviceModel) {
      deviceName = components.deviceModel; // Hardware model as fallback
    }

    // Extract app info from headers or user agent
    let appName = 'Mobile App';
    let appVersion = '';

    if (components.appVersion) {
      appVersion = components.appVersion;
    }

    // Try to extract app name from user agent if available
    if (userAgent) {
      const appMatch = userAgent.match(/^([^\/]+)\/([^\s]+)/);
      if (appMatch) {
        appName = appMatch[1];
        if (!appVersion) {
          appVersion = appMatch[2];
        }
      }
    }

    return {
      fingerprint: fingerprint.primary,
      secondaryFingerprint: fingerprint.secondary,
      confidence: fingerprint.confidence,
      deviceType: DeviceType.MOBILE, // Always mobile for mobile apps
      deviceName: deviceName,
      osName: osName,
      osVersion: osVersion,
      browserName: appName, // Use app name instead of browser name
      browserVersion: appVersion, // Use app version instead of browser version
      userAgent: userAgent,
      ipAddress: this.getRequesterIpAddress(req),
      components: fingerprint.components,
      validation: fingerprint.validation,
      isMobileApp: true,
      hasDeviceId: fingerprint.validation.hasDeviceId,
      isConsistent: fingerprint.validation.isConsistent,
    };
  }

  /**
   * USER-AGENT APPROACH: Get device info for browsers using traditional parsing
   */
  private getBrowserDeviceInfo(
    fingerprint: DeviceFingerprint,
    parsed: ParsedUserAgent,
    userAgent: string,
    req: FastifyRequest,
  ) {
    return {
      fingerprint: fingerprint.primary,
      secondaryFingerprint: fingerprint.secondary,
      confidence: fingerprint.confidence,
      deviceType: parsed.device.type,
      deviceName: '', // Browsers typically don't have device names
      osName: parsed.os.name,
      osVersion: parsed.os.version,
      browserName: parsed.browser.name,
      browserVersion: parsed.browser.version,
      userAgent: userAgent,
      ipAddress: this.getRequesterIpAddress(req),
      components: fingerprint.components,
      validation: fingerprint.validation,
      isMobileApp: false,
      hasDeviceId: fingerprint.validation.hasDeviceId,
      isConsistent: fingerprint.validation.isConsistent,
    };
  }

  /**
   * DECODE DEVICE NAME: Safely decode Base64 encoded device names
   */
  private decodeDeviceName(encodedName: string): string {
    if (!encodedName) return '';

    try {
      // Check if it's Base64 encoded (starts with common patterns)
      if (encodedName.match(/^[A-Za-z0-9+/=]+$/)) {
        // Decode Base64
        const decoded = Buffer.from(encodedName, 'base64').toString('utf-8');
        return decoded;
      }

      // If not Base64, return as-is (backward compatibility)
      return encodedName;
    } catch (error) {
      console.warn('Failed to decode device name', { encodedName, error });
      return encodedName; // Return original if decoding fails
    }
  }

  /**
   * ENCODE DEVICE NAME: Safely encode device names to Base64 for headers
   */
  static encodeDeviceName(deviceName: string): string {
    if (!deviceName) return '';

    try {
      // Encode to Base64 for safe header transmission
      return Buffer.from(deviceName, 'utf-8').toString('base64');
    } catch (error) {
      console.warn('Failed to encode device name', { deviceName, error });
      return deviceName; // Return original if encoding fails
    }
  }

  /**
   * DETECT MOBILE APP: Check if this is a mobile app based on headers
   */
  private isMobileAppByHeaders(
    components: DeviceFingerprint['components'],
  ): boolean {
    const userAgent = components.userAgent || '';

    // First, check if this is definitely a browser (exclude from mobile app detection)
    const isDefinitelyBrowser = this.isDefinitelyBrowser(userAgent);
    if (isDefinitelyBrowser) {
      return false;
    }

    // Check for mobile app specific headers
    const hasMobileHeaders = !!(
      components.deviceId ||
      components.deviceModel ||
      components.systemVersion ||
      components.appVersion ||
      components.deviceCapabilities
    );

    // Check for mobile app user agent patterns (more specific)
    const hasMobileUserAgent = !!(
      userAgent &&
      (userAgent.includes('ArzdigitalApp') ||
        userAgent.includes('Mobile App') ||
        // More specific mobile app pattern
        /^[A-Za-z0-9_-]+\/\d+\.\d+\.\d+ \(iOS \d+\.\d+;[A-F0-9-]+\)$/.test(
          userAgent,
        ) ||
        /^[A-Za-z0-9_-]+\/\d+\.\d+\.\d+ \(Android \d+;[A-F0-9-]+\)$/.test(
          userAgent,
        ) ||
        // Generic mobile app pattern (fallback)
        /^[A-Za-z0-9_-]+\/\d+\.\d+\.\d+ \(.*?\)$/.test(userAgent))
    );

    return hasMobileHeaders || hasMobileUserAgent;
  }

  /**
   * DETECT BROWSER: Check if this is definitely a browser
   */
  private isDefinitelyBrowser(userAgent: string): boolean {
    if (!userAgent) return false;

    // Known browser patterns
    const browserPatterns = [
      /Mozilla\/\d+\.\d+/, // Standard browser pattern
      /Chrome\/\d+/, // Chrome
      /Safari\/\d+/, // Safari
      /Firefox\/\d+/, // Firefox
      /Edge\/\d+/, // Edge
      /Opera\/\d+/, // Opera
      /MSIE \d+/, // Internet Explorer
      /Trident\/\d+/, // IE Trident engine
    ];

    // Check if User-Agent matches any browser pattern
    return browserPatterns.some((pattern) => pattern.test(userAgent));
  }

  /**
   * IP ADDRESS EXTRACTION: Enhanced with better validation
   */
  private getRequesterIpAddress(req: FastifyRequest): string {
    // Priority order for IP detection
    const headers = [
      'cf-connecting-ip', // Cloudflare
      'x-real-ip', // Nginx
      'x-forwarded-for', // Standard proxy
      'x-client-ip', // Alternative
    ];

    for (const header of headers) {
      const ip = req.headers[header];
      if (ip && typeof ip === 'string') {
        const cleanIp = ip.split(',')[0].trim();
        if (this.isValidIP(cleanIp)) {
          return cleanIp;
        }
      }
    }

    // Fallback to connection IP
    const connectionIp = req.ip || req.socket?.remoteAddress || '';
    return this.isValidIP(connectionIp) ? connectionIp : '0.0.0.0';
  }

  /**
   * IP VALIDATION: More comprehensive
   */
  private isValidIP(ip: string): boolean {
    // IPv4 validation
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // IPv6 validation (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    // Check for private/internal IPs that shouldn't be used as fingerprints
    const privateRanges = [
      /^127\./, // Loopback
      /^10\./, // Private Class A
      /^192\.168\./, // Private Class C
      /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private Class B
    ];

    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      return false;
    }

    // Allow private IPs in development, but flag for production
    return (
      !privateRanges.some((range) => range.test(ip)) ||
      process.env.NODE_ENV === 'development'
    );
  }
}
