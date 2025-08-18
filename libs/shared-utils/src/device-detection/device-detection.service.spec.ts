import { Test, TestingModule } from '@nestjs/testing';
import { FastifyRequest } from 'fastify';
import {
  SecurityAnalyses,
  SecurityAnalysis,
} from './device-detection.interface';
import { DeviceDetectionService } from './device-detection.service';

describe('DeviceDetectionService', () => {
  let service: DeviceDetectionService;

  // Helper function to create mock FastifyRequest
  const createMockRequest = (headers: any, ip?: string): FastifyRequest => {
    return {
      headers,
      ip: ip || '192.168.1.100',
    } as unknown as FastifyRequest;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeviceDetectionService],
    }).compile();

    service = module.get<DeviceDetectionService>(DeviceDetectionService);
  });

  describe('Security Analysis - Behavioral Detection', () => {
    describe('analyzeRequestBehavior', () => {
      it('should detect legitimate mobile app requests with low risk', async () => {
        // Arrange: Legitimate mobile app request
        const mockReq = createMockRequest(
          {
            'user-agent':
              'ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)',
            'x-device-id': '4744E0EB-2796-4F4F-9C16-60DBB0116A91',
            'x-device-model': 'iPhone14,2',
            'x-system-version': 'iOS 17.2',
            'x-app-version': '3.0.0',
            'x-device-name': 'Qm9iJ3MgaVBob25l', // Base64 encoded "Bob's iPhone"
          },
          '192.168.1.100',
        );

        // Act
        const result = await service.analyzeRequestBehavior(mockReq);

        // Assert
        expect(result.securityScore).toBeLessThan(0.3);
        expect(result.riskLevel).toBe('low');
        expect(result.suspiciousPatterns).toHaveLength(0);
        expect(result.recommendations).toContain(
          'Monitor for suspicious patterns',
        );
      });

      it('should detect legitimate browser requests with low risk', async () => {
        // Arrange: Legitimate browser request
        const mockReq = {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'sec-ch-ua-platform': '"Windows"',
            'accept-language': 'en-US,en;q=0.9',
          },
          ip: '192.168.1.101',
        } as FastifyRequest;

        // Act
        const result = await service.analyzeRequestBehavior(mockReq);

        // Assert
        expect(result.securityScore).toBeLessThan(0.3);
        expect(result.riskLevel).toBe('low');
        expect(result.suspiciousPatterns).toHaveLength(0);
      });

      it('should detect automated bot attacks with critical risk', async () => {
        // Arrange: Obvious bot attack
        const mockReq = {
          headers: {
            'user-agent': 'curl/7.68.0',
            'x-device-id': '00000000-0000-0000-0000-000000000000',
            'x-device-model': 'FakeDevice',
          },
          ip: '192.168.1.102',
        } as FastifyRequest;

        // Act
        const result = await service.analyzeRequestBehavior(mockReq);

        // Assert
        expect(result.securityScore).toBeGreaterThan(0.9);
        expect(result.riskLevel).toBe('critical');
        expect(result.suspiciousPatterns).toContain(
          'Suspicious User-Agent patterns detected',
        );
        expect(result.recommendations).toContain(
          'Require additional authentication',
        );
      });

      it('should detect selenium automation with high risk', async () => {
        // Arrange: Selenium automation
        const mockReq = {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (selenium)',
            'x-device-id': '12345678-1234-1234-1234-123456789012',
          },
          ip: '192.168.1.103',
        } as FastifyRequest;

        // Act
        const result = await service.analyzeRequestBehavior(mockReq);

        // Assert
        expect(result.securityScore).toBeGreaterThan(0.7);
        expect(result.riskLevel).toBe('high');
        expect(result.suspiciousPatterns).toContain(
          'Suspicious User-Agent patterns detected',
        );
      });

      it('should detect header inconsistencies with medium risk', async () => {
        // Arrange: Mobile app with browser headers (inconsistent)
        const mockReq = {
          headers: {
            'user-agent':
              'ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)',
            'x-device-id': '4744E0EB-2796-4F4F-9C16-60DBB0116A91',
            'sec-ch-ua-platform': '"Windows"', // Browser header in mobile app
          },
          ip: '192.168.1.104',
        } as FastifyRequest;

        // Act
        const result = await service.analyzeRequestBehavior(mockReq);

        // Assert
        expect(result.securityScore).toBeGreaterThan(0.5);
        expect(result.riskLevel).toBe('medium');
        expect(result.suspiciousPatterns).toContain(
          'Header inconsistencies detected',
        );
      });

      it('should detect missing User-Agent with high risk', async () => {
        // Arrange: Missing User-Agent
        const mockReq = {
          headers: {
            'x-device-id': '4744E0EB-2796-4F4F-9C16-60DBB0116A91',
          },
          ip: '192.168.1.105',
        } as FastifyRequest;

        // Act
        const result = await service.analyzeRequestBehavior(mockReq);

        // Assert
        expect(result.securityScore).toBeGreaterThan(0.7);
        expect(result.riskLevel).toBe('high');
        expect(result.suspiciousPatterns).toContain(
          'Suspicious User-Agent patterns detected',
        );
      });

      it('should detect random UUID patterns with medium risk', async () => {
        // Arrange: Multiple random UUIDs in User-Agent
        const mockReq = {
          headers: {
            'user-agent':
              'App/1.0 (12345678-1234-1234-1234-123456789012; 87654321-4321-4321-4321-210987654321; abcdef12-3456-7890-abcd-ef1234567890)',
            'x-device-id': '12345678-1234-1234-1234-123456789012',
          },
          ip: '192.168.1.106',
        } as FastifyRequest;

        // Act
        const result = await service.analyzeRequestBehavior(mockReq);

        // Assert
        expect(result.securityScore).toBeGreaterThan(0.5);
        expect(result.riskLevel).toBe('medium');
        expect(result.suspiciousPatterns).toContain(
          'Suspicious User-Agent patterns detected',
        );
      });

      it('should detect mobile app missing required headers with medium risk', async () => {
        // Arrange: Mobile app without device headers
        const mockReq = {
          headers: {
            'user-agent':
              'ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)',
            // Missing x-device-id, x-device-model, etc.
          },
          ip: '192.168.1.107',
        } as FastifyRequest;

        // Act
        const result = await service.analyzeRequestBehavior(mockReq);

        // Assert
        expect(result.securityScore).toBeGreaterThan(0.5);
        expect(result.riskLevel).toBe('medium');
        expect(result.suspiciousPatterns).toContain(
          'Header inconsistencies detected',
        );
      });

      it('should detect invalid device model format with medium risk', async () => {
        // Arrange: Invalid device model
        const mockReq = {
          headers: {
            'user-agent':
              'ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)',
            'x-device-id': '4744E0EB-2796-4F4F-9C16-60DBB0116A91',
            'x-device-model': 'InvalidDeviceModel123!@#', // Invalid format
          },
          ip: '192.168.1.108',
        } as FastifyRequest;

        // Act
        const result = await service.analyzeRequestBehavior(mockReq);

        // Assert
        expect(result.securityScore).toBeGreaterThan(0.5);
        expect(result.riskLevel).toBe('medium');
        expect(result.suspiciousPatterns).toContain(
          'Header inconsistencies detected',
        );
      });
    });

    describe('User-Agent Analysis', () => {
      it('should detect missing User-Agent', () => {
        const result = service['analyzeUserAgentPatterns']('');
        expect(result.isMissing).toBe(true);
        expect(result.riskScore).toBeGreaterThan(0.3);
      });

      it('should detect suspicious keywords', () => {
        const result = service['analyzeUserAgentPatterns'](
          'Mozilla/5.0 (selenium) Chrome/120.0.0.0',
        );
        expect(result.hasSuspiciousKeywords).toBe(true);
        expect(result.isAutomated).toBe(true);
        expect(result.riskScore).toBeGreaterThan(0.4);
      });

      it('should detect random UUID patterns', () => {
        const result = service['analyzeUserAgentPatterns'](
          'App/1.0 (12345678-1234-1234-1234-123456789012; 87654321-4321-4321-4321-210987654321)',
        );
        expect(result.hasRandomPatterns).toBe(true);
        expect(result.riskScore).toBeGreaterThan(0.3);
      });

      it('should detect legitimate User-Agent', () => {
        const result = service['analyzeUserAgentPatterns'](
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15',
        );
        expect(result.isSuspicious).toBe(false);
        expect(result.riskScore).toBeLessThan(0.3);
      });
    });

    describe('Header Consistency Analysis', () => {
      it('should detect mobile app with browser headers inconsistency', () => {
        const mockReq = {
          headers: {
            'user-agent':
              'ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)',
            'sec-ch-ua-platform': '"Windows"', // Browser header in mobile app
          },
        } as FastifyRequest;

        const result = service['analyzeHeaderConsistency'](mockReq);
        expect(result.isConsistent).toBe(false);
        expect(result.inconsistencies).toContain(
          'Suspicious header combination',
        );
      });

      it('should detect browser with mobile headers inconsistency', () => {
        const mockReq = {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'x-device-id': '4744E0EB-2796-4F4F-9C16-60DBB0116A91', // Mobile header in browser
          },
        } as FastifyRequest;

        const result = service['analyzeHeaderConsistency'](mockReq);
        expect(result.isConsistent).toBe(false);
        expect(result.inconsistencies).toContain(
          'Suspicious header combination',
        );
      });

      it('should detect mobile app missing required headers', () => {
        const mockReq = {
          headers: {
            'user-agent':
              'ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)',
            // Missing mobile headers
          },
        } as FastifyRequest;

        const result = service['analyzeHeaderConsistency'](mockReq);
        expect(result.isConsistent).toBe(false);
        expect(result.inconsistencies).toContain(
          'Mobile app missing device headers',
        );
      });

      it('should accept consistent mobile app headers', () => {
        const mockReq = {
          headers: {
            'user-agent':
              'ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)',
            'x-device-id': '4744E0EB-2796-4F4F-9C16-60DBB0116A91',
            'x-device-model': 'iPhone14,2',
            'x-system-version': 'iOS 17.2',
          },
        } as FastifyRequest;

        const result = service['analyzeHeaderConsistency'](mockReq);
        expect(result.isConsistent).toBe(true);
        expect(result.inconsistencies).toHaveLength(0);
      });

      it('should accept consistent browser headers', () => {
        const mockReq = {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'sec-ch-ua-platform': '"Windows"',
            'accept-language': 'en-US,en;q=0.9',
          },
        } as FastifyRequest;

        const result = service['analyzeHeaderConsistency'](mockReq);
        expect(result.isConsistent).toBe(true);
        expect(result.inconsistencies).toHaveLength(0);
      });
    });

    describe('Risk Level Calculation', () => {
      it('should return low risk for scores < 0.3', () => {
        expect(service['getRiskLevel'](0.1)).toBe('low');
        expect(service['getRiskLevel'](0.2)).toBe('low');
        expect(service['getRiskLevel'](0.29)).toBe('low');
      });

      it('should return medium risk for scores 0.3-0.6', () => {
        expect(service['getRiskLevel'](0.3)).toBe('medium');
        expect(service['getRiskLevel'](0.45)).toBe('medium');
        expect(service['getRiskLevel'](0.59)).toBe('medium');
      });

      it('should return high risk for scores 0.6-0.8', () => {
        expect(service['getRiskLevel'](0.6)).toBe('high');
        expect(service['getRiskLevel'](0.7)).toBe('high');
        expect(service['getRiskLevel'](0.79)).toBe('high');
      });

      it('should return critical risk for scores >= 0.8', () => {
        expect(service['getRiskLevel'](0.8)).toBe('critical');
        expect(service['getRiskLevel'](0.9)).toBe('critical');
        expect(service['getRiskLevel'](1.0)).toBe('critical');
      });
    });

    describe('Security Score Calculation', () => {
      it('should calculate weighted security score correctly', () => {
        const analyses = {
          timingAnalysis: { riskScore: 0.1 },
          userAgentAnalysis: { riskScore: 0.2 },
          headerAnalysis: { consistencyScore: 0.8 }, // 1 - 0.8 = 0.2 risk
          geographicAnalysis: { riskScore: 0.3 },
          networkAnalysis: { riskScore: 0.4 },
        };

        const score = service['calculateSecurityScore'](analyses);

        // Expected: (0.1 * 0.25) + (0.2 * 0.25) + (0.2 * 0.2) + (0.3 * 0.15) + (0.4 * 0.15)
        // = 0.025 + 0.05 + 0.04 + 0.045 + 0.06 = 0.22
        expect(score).toBeCloseTo(0.22, 2);
      });

      it('should handle high risk scores', () => {
        const analyses = {
          timingAnalysis: { riskScore: 0.9 },
          userAgentAnalysis: { riskScore: 0.8 },
          headerAnalysis: { consistencyScore: 0.1 }, // 1 - 0.1 = 0.9 risk
          geographicAnalysis: { riskScore: 0.7 },
          networkAnalysis: { riskScore: 0.6 },
        };

        const score = service['calculateSecurityScore'](analyses);
        expect(score).toBeGreaterThan(0.8);
      });
    });
  });

  describe('Device Detection (Legitimate Users)', () => {
    describe('getCompleteDeviceInfo', () => {
      it('should detect mobile app correctly', () => {
        const mockReq = {
          headers: {
            'user-agent':
              'ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)',
            'x-device-id': '4744E0EB-2796-4F4F-9C16-60DBB0116A91',
            'x-device-model': 'iPhone14,2',
            'x-device-name': 'Qm9iJ3MgaVBob25l', // Base64 encoded
            'x-system-version': 'iOS 17.2',
            'x-app-version': '3.0.0',
          },
          ip: '192.168.1.100',
        } as FastifyRequest;

        const result = service.getCompleteDeviceInfo(mockReq);

        expect(result.deviceType).toBe('MOBILE');
        expect(result.osName).toBe('iOS');
        expect(result.osVersion).toBe('17.2');
        expect(result.deviceName).toBe("Bob's iPhone"); // Decoded from Base64
        expect(result.browserName).toBe('ArzdigitalApp');
        expect(result.browserVersion).toBe('3.0.0');
        expect(result.isMobileApp).toBe(true);
        expect(result.hasDeviceId).toBe(true);
      });

      it('should detect browser correctly', () => {
        const mockReq = {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'sec-ch-ua-platform': '"Windows"',
            'accept-language': 'en-US,en;q=0.9',
          },
          ip: '192.168.1.101',
        } as FastifyRequest;

        const result = service.getCompleteDeviceInfo(mockReq);

        expect(result.deviceType).toBe('DESKTOP');
        expect(result.osName).toBe('Windows');
        expect(result.browserName).toBe('Chrome');
        expect(result.browserVersion).toBe('120.0.0.0');
        expect(result.isMobileApp).toBe(false);
        expect(result.hasDeviceId).toBe(false);
      });
    });

    describe('Base64 Device Name Encoding/Decoding', () => {
      it('should decode Base64 device names correctly', () => {
        const encoded = 'Qm9iJ3MgaVBob25l'; // "Bob's iPhone"
        const decoded = service['decodeDeviceName'](encoded);
        expect(decoded).toBe("Bob's iPhone");
      });

      it('should handle non-Base64 device names', () => {
        const plainText = "John's iPhone";
        const result = service['decodeDeviceName'](plainText);
        expect(result).toBe("John's iPhone");
      });

      it('should handle empty device names', () => {
        const result = service['decodeDeviceName']('');
        expect(result).toBe('');
      });

      it('should handle invalid Base64 gracefully', () => {
        const invalid = 'InvalidBase64!@#';
        const result = service['decodeDeviceName'](invalid);
        expect(result).toBe(invalid); // Should return original if decoding fails
      });
    });
  });
});
