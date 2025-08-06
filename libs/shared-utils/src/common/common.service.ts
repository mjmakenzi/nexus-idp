import { Injectable } from '@nestjs/common';
import { DeviceType } from '@app/db/entities/device.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';

@Injectable()
export class CommonService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Execute a function within a database transaction
   * @param callback Function to execute within transaction
   * @returns Result of the callback function
   */
  async executeInTransaction<T>(
    callback: (em: EntityManager) => Promise<T>,
  ): Promise<T> {
    return await this.em.transactional(callback);
  }

  /**
   * Execute a function within a transaction with retry logic
   * @param callback Function to execute within transaction
   * @param maxRetries Maximum number of retry attempts
   * @returns Result of the callback function
   */
  async executeInTransactionWithRetry<T>(
    callback: (em: EntityManager) => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.em.transactional(callback);
      } catch (error) {
        lastError = error as Error;

        // Only retry on specific database errors (deadlocks, timeouts)
        if (this.isRetryableError(error) && attempt < maxRetries) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 100);
          continue;
        }

        throw error;
      }
    }

    throw lastError!;
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'deadlock',
      'timeout',
      'connection',
      'serialization',
      'could not serialize access',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some((retryableError) =>
      errorMessage.includes(retryableError),
    );
  }

  /**
   * Delay execution for a specified number of milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

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
  static getRequesterDeviceType(req: FastifyRequest): DeviceType {
    const ua = this.getRequesterUserAgent(req).toLowerCase();
    const deviceType = this.getMobileTokenRegex()
      ? ua.match(this.getMobileTokenRegex())
      : ua.match(this.getBrowserTokenRegex());

    return deviceType
      ? deviceType.groups?.browserName
        ? DeviceType.DESKTOP
        : DeviceType.MOBILE
      : DeviceType.UNKNOWN;
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
