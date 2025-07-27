import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';

@Injectable()
export class CommonService {
  generateRandomUserDataKey(): string {
    return randomBytes(16).toString('hex');
  }

  generateRandomUserName(): string {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  }

  async generateRandomPassword(): Promise<{
    passwordHash: string;
    passwordSalt: string;
  }> {
    const plainPassword = randomUUID();
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, passwordSalt);
    return { passwordHash, passwordSalt };
  }

  async hash(data: string): Promise<string> {
    return await bcrypt.hash(data, 10);
  }

  async compare(data: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(data, hash);
  }

  static getMobileTokenRegex(): RegExp {
    return /^(?<appName>[^\/]+)\/(?<appVersion>[^\s]+) \((?:(?<deviceName>[^;]+);)?(?<systemName>[^ ]+) (?<systemVersion>[^\s;]+);(?<uniqueId>[^;]+)\)$/;
  }

  static getBrowserTokenRegex(): RegExp {
    // Matches standard browser user agent strings, e.g.:
    // Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36
    return /^(?<browserName>[^\s\/]+)\/(?<browserVersion>[^\s]+)\s\((?<systemInfo>[^)]+)\)\s(?<engine>[^\s\/]+)\/(?<engineVersion>[^\s]+)\s\((?<engineDetails>[^)]+)\)\s(?<mainBrowser>[^\s\/]+)\/(?<mainBrowserVersion>[^\s]+)\s(?<extra>.+)$/;
  }

  static getBrowserFingerprint(req: FastifyRequest): string {
    const browserFingerprint = req.headers['x-browser-fingerprint'];
    if (browserFingerprint && typeof browserFingerprint === 'string') {
      return browserFingerprint;
    }
    return randomUUID();
  }

  /**
   * Get the requester's IP address from the request headers or connection.
   */
  static getRequesterIpAddress(req: FastifyRequest): string {
    // Check for X-Forwarded-For header (may be a comma-separated list)
    const xForwardedFor = req.headers['x-forwarded-for'];
    let ip = '';
    if (xForwardedFor && typeof xForwardedFor === 'string') {
      ip = xForwardedFor.split(',')[0].trim();
    } else if (Array.isArray(xForwardedFor)) {
      ip = xForwardedFor[0];
    } else {
      ip = req.ip || '';
    }
    // Validate IP
    if (
      /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip) ||
      /^[a-fA-F0-9:]+$/.test(ip)
    ) {
      return ip;
    }
    return '0.0.0.0';
  }

  /**
   * Get the requester's user agent string.
   */
  static getRequesterUserAgent(req: FastifyRequest): string {
    return req.headers['user-agent'] || '';
  }

  /**
   * Determine if the requester is using a mobile or desktop device based on user agent.
   */
  static getRequesterDeviceType(req: FastifyRequest): string {
    const ua = this.getRequesterUserAgent(req).toLowerCase();
    const deviceType = this.getMobileTokenRegex()
      ? ua.match(this.getMobileTokenRegex())
      : ua.match(this.getBrowserTokenRegex());

    return deviceType
      ? deviceType.groups?.browserName
        ? 'browser'
        : 'mobile'
      : 'desktop';
  }

  /**
   * Get the requester's device info (os/platform) from user agent.
   */
  // static getRequesterDeviceInfo(
  //   req: FastifyRequest,
  // ): 'ios' | 'android' | 'windows' | 'unknown' {
  //   const ua = this.getRequesterUserAgent(req).toLowerCase();
  //   if (ua.includes('iphone') || ua.includes('ipad')) {
  //     return 'ios';
  //   } else if (ua.includes('android')) {
  //     return 'android';
  //   } else if (ua.includes('windows')) {
  //     return 'windows';
  //   } else {
  //     return 'unknown';
  //   }
  // }

  static getRequesterDeviceFingerprint(req: FastifyRequest): string {
    const ua = this.getRequesterUserAgent(req).toLowerCase();
    const deviceFingerprint = ua.match(this.getMobileTokenRegex());
    if (deviceFingerprint) {
      return deviceFingerprint.groups?.uniqueId || '';
    }
    return this.getBrowserFingerprint(req);
  }

  static getRequesterOsName(req: FastifyRequest): string {
    const ua = this.getRequesterUserAgent(req).toLowerCase();
    const osName = ua.match(this.getMobileTokenRegex());
    return osName ? osName.groups?.systemName || '' : '';
  }

  static getRequesterOsVersion(req: FastifyRequest): string {
    const ua = this.getRequesterUserAgent(req).toLowerCase();
    const osVersion = ua.match(this.getMobileTokenRegex());
    return osVersion ? osVersion.groups?.systemVersion || '' : '';
  }

  static getRequesterBrowserName(req: FastifyRequest): string {
    const ua = this.getRequesterUserAgent(req).toLowerCase();
    const browserName = ua.match(this.getBrowserTokenRegex());
    return browserName ? browserName.groups?.browserName || '' : '';
  }

  static getRequesterBrowserVersion(req: FastifyRequest): string {
    const ua = this.getRequesterUserAgent(req).toLowerCase();
    const browserVersion = ua.match(this.getBrowserTokenRegex());
    return browserVersion ? browserVersion.groups?.browserVersion || '' : '';
  }
}
