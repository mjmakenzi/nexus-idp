import { Injectable, Logger } from '@nestjs/common';
import {
  SessionTerminationReason,
  Severity,
  UserEntity,
  UserRepository,
  UserStatus,
} from '@app/db';
import { SecurityService } from '@app/security';
import { SessionService } from '@app/shared-utils';
import { FastifyRequest } from 'fastify';

export interface AccountActionDto {
  userId: bigint;
  reason: string;
  duration?: number; // For locks (in minutes)
  adminId?: bigint; // Admin who performed the action
  evidence?: Record<string, any>; // Supporting evidence
}

export interface SecurityAnalysisResult {
  securityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suspiciousPatterns: string[];
  recommendations: string[];
}

@Injectable()
export class AccountManagementService {
  private readonly logger = new Logger(AccountManagementService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly securityService: SecurityService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Suspend a user account
   * Used for security violations, policy violations, or admin decisions
   */
  async suspendUser(dto: AccountActionDto, req: FastifyRequest): Promise<void> {
    const user = await this.userRepository.getUserByIdWithDeleted(
      Number(dto.userId),
    );
    if (!user) {
      throw new Error('User not found');
    }

    // Update user status
    await this.userRepository.updateUser(user.id, {
      status: UserStatus.SUSPENDED,
      updatedAt: new Date(),
      updatedBy: dto.adminId ? String(dto.adminId) : 'system',
    });

    // Terminate all active sessions
    await this.sessionService.terminateAllUserSessions(
      Number(user.id),
      SessionTerminationReason.SUSPENDED,
    );

    // Log security event
    await this.securityService.createSecurityEvent({
      user: user,
      req: req,
      session: null,
      eventType: 'account_suspended',
      eventCategory: 'account',
      severity: Severity.HIGH,
    });

    this.logger.warn(`User ${user.id} suspended: ${dto.reason}`, {
      userId: user.id,
      reason: dto.reason,
      adminId: dto.adminId,
      evidence: dto.evidence,
    });
  }

  /**
   * Soft delete a user account
   * Used for user requests, GDPR compliance, or long-term inactivity
   */
  async softDeleteUser(
    dto: AccountActionDto,
    req: FastifyRequest,
  ): Promise<void> {
    const user = await this.userRepository.getUserByIdWithDeleted(
      Number(dto.userId),
    );
    if (!user) {
      throw new Error('User not found');
    }

    // Anonymize user data
    const anonymizedData = {
      username: `deleted_${user.id}_${Date.now()}`,
      email: `deleted_${user.id}@deleted.invalid`,
      emailNormalized: `deleted_${user.id}@deleted.invalid`,
      deletedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: dto.adminId ? String(dto.adminId) : 'system',
    };

    // Update user with anonymized data
    await this.userRepository.updateUser(user.id, anonymizedData);

    // Terminate all active sessions
    await this.sessionService.terminateAllUserSessions(
      Number(user.id),
      SessionTerminationReason.DELETED,
    );

    // Log security event
    await this.securityService.createSecurityEvent({
      user: user,
      req: req,
      session: null,
      eventType: 'account_deleted',
      eventCategory: 'account',
      severity: Severity.MEDIUM,
    });

    this.logger.warn(`User ${user.id} soft deleted: ${dto.reason}`, {
      userId: user.id,
      reason: dto.reason,
      adminId: dto.adminId,
      evidence: dto.evidence,
    });
  }

  /**
   * Lock a user account temporarily
   * Used for security protection, brute force prevention
   */
  async lockUserAccount(
    dto: AccountActionDto,
    req: FastifyRequest,
  ): Promise<void> {
    const user = await this.userRepository.getUserById(Number(dto.userId));
    if (!user) {
      throw new Error('User not found');
    }

    const lockDuration = dto.duration || 30; // Default 30 minutes
    const lockedUntil = new Date(Date.now() + lockDuration * 60 * 1000);

    // Update user with lock
    await this.userRepository.updateUser(user.id, {
      lockedUntil: lockedUntil,
      updatedAt: new Date(),
      updatedBy: dto.adminId ? String(dto.adminId) : 'system',
    });

    // Log security event
    await this.securityService.createSecurityEvent({
      user: user,
      req: req,
      session: null,
      eventType: 'account_locked',
      eventCategory: 'security',
      severity: Severity.MEDIUM,
    });

    this.logger.warn(
      `User ${user.id} locked for ${lockDuration} minutes: ${dto.reason}`,
      {
        userId: user.id,
        reason: dto.reason,
        lockDuration,
        lockedUntil,
        adminId: dto.adminId,
        evidence: dto.evidence,
      },
    );
  }

  /**
   * Unlock a user account
   */
  async unlockUserAccount(
    dto: AccountActionDto,
    req: FastifyRequest,
  ): Promise<void> {
    const user = await this.userRepository.getUserById(Number(dto.userId));
    if (!user) {
      throw new Error('User not found');
    }

    // Remove lock
    await this.userRepository.updateUser(user.id, {
      lockedUntil: undefined,
      failedLoginAttempts: 0, // Reset failed attempts
      updatedAt: new Date(),
      updatedBy: dto.adminId ? String(dto.adminId) : 'system',
    });

    // Log security event
    await this.securityService.createSecurityEvent({
      user: user,
      req: req,
      session: null,
      eventType: 'account_unlocked',
      eventCategory: 'security',
      severity: Severity.LOW,
    });

    this.logger.log(`User ${user.id} unlocked: ${dto.reason}`, {
      userId: user.id,
      reason: dto.reason,
      adminId: dto.adminId,
    });
  }

  /**
   * Reactivate a suspended user account
   */
  async reactivateUser(
    dto: AccountActionDto,
    req: FastifyRequest,
  ): Promise<void> {
    const user = await this.userRepository.getUserByIdWithDeleted(
      Number(dto.userId),
    );
    if (!user) {
      throw new Error('User not found');
    }

    // Reactivate user
    await this.userRepository.updateUser(user.id, {
      status: UserStatus.ACTIVE,
      updatedAt: new Date(),
      updatedBy: dto.adminId ? String(dto.adminId) : 'system',
    });

    // Log security event
    await this.securityService.createSecurityEvent({
      user: user,
      req: req,
      session: null,
      eventType: 'account_reactivated',
      eventCategory: 'account',
      severity: Severity.LOW,
    });

    this.logger.log(`User ${user.id} reactivated: ${dto.reason}`, {
      userId: user.id,
      reason: dto.reason,
      adminId: dto.adminId,
    });
  }

  /**
   * Analyze user security and recommend actions
   */
  async analyzeUserSecurity(userId: bigint): Promise<SecurityAnalysisResult> {
    const user = await this.userRepository.getUserById(Number(userId));
    if (!user) {
      throw new Error('User not found');
    }

    // Analyze failed login attempts
    const failedLoginRisk = this.analyzeFailedLoginRisk(
      user.failedLoginAttempts,
    );

    // Analyze account age and activity
    const activityRisk = this.analyzeActivityRisk(user);

    // Analyze security events
    const securityEventRisk = await this.analyzeSecurityEvents(user);

    // Calculate overall security score
    const securityScore =
      (failedLoginRisk + activityRisk + securityEventRisk) / 3;

    // Determine risk level
    const riskLevel = this.getRiskLevel(securityScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(securityScore, user);

    return {
      securityScore,
      riskLevel,
      suspiciousPatterns: this.detectSuspiciousPatterns(user),
      recommendations,
    };
  }

  /**
   * Automated security response based on analysis
   */
  async automatedSecurityResponse(
    userId: bigint,
    req: FastifyRequest,
  ): Promise<void> {
    const analysis = await this.analyzeUserSecurity(userId);

    if (analysis.riskLevel === 'critical') {
      await this.suspendUser(
        {
          userId,
          reason: 'Automated suspension due to critical security risk',
          evidence: { analysis },
        },
        req,
      );
    } else if (analysis.riskLevel === 'high') {
      await this.lockUserAccount(
        {
          userId,
          reason: 'Automated lock due to high security risk',
          duration: 60, // 1 hour
          evidence: { analysis },
        },
        req,
      );
    }
  }

  private analyzeFailedLoginRisk(failedAttempts: number): number {
    if (failedAttempts >= 10) return 1.0;
    if (failedAttempts >= 7) return 0.8;
    if (failedAttempts >= 5) return 0.6;
    if (failedAttempts >= 3) return 0.4;
    return 0.1;
  }

  private analyzeActivityRisk(user: UserEntity): number {
    const now = new Date();
    const lastLogin = user.lastLoginAt;

    if (!lastLogin) return 0.3; // New user

    const daysSinceLastLogin =
      (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastLogin > 365) return 0.8; // Very old
    if (daysSinceLastLogin > 90) return 0.6; // Old
    if (daysSinceLastLogin > 30) return 0.4; // Somewhat old
    return 0.1; // Recent
  }

  private async analyzeSecurityEvents(user: UserEntity): Promise<number> {
    // This would analyze recent security events for the user
    // For now, return a base score
    return 0.2;
  }

  private getRiskLevel(
    securityScore: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (securityScore >= 0.8) return 'critical';
    if (securityScore >= 0.6) return 'high';
    if (securityScore >= 0.4) return 'medium';
    return 'low';
  }

  private detectSuspiciousPatterns(user: UserEntity): string[] {
    const patterns: string[] = [];

    if (user.failedLoginAttempts >= 5) {
      patterns.push('Multiple failed login attempts');
    }

    if (!user.emailVerifiedAt) {
      patterns.push('Unverified email address');
    }

    if (!user.phoneVerifiedAt) {
      patterns.push('Unverified phone number');
    }

    return patterns;
  }

  private generateRecommendations(
    securityScore: number,
    user: UserEntity,
  ): string[] {
    const recommendations: string[] = [];

    if (user.failedLoginAttempts >= 3) {
      recommendations.push(
        'Consider implementing account lockout after failed attempts',
      );
    }

    if (!user.emailVerifiedAt) {
      recommendations.push('Require email verification for account activation');
    }

    if (securityScore > 0.6) {
      recommendations.push('Enable enhanced monitoring for this account');
    }

    return recommendations;
  }
}
