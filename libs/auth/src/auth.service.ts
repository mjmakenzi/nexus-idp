import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateOtpDto,
  FindOtpDto,
  LoginEmailDto,
  LoginPhoneDto,
  SendOtpEmailDto,
  SendOtpPhoneDto,
} from '@app/auth';
import {
  OtpDeliveryMethod,
  OtpIdentifier,
  OtpPurpose,
  RateLimitScope,
  RevocationReason,
  SessionTerminationReason,
  Severity,
  UserEntity,
  UserStatus,
} from '@app/db';
import { DevicesService } from '@app/devices';
import {
  CreateSecurityEventDto,
  FindRateLimitDto,
  SecurityService,
} from '@app/security';
import {
  CommonService,
  JwtService,
  KavenegarService,
  LoggerService,
  OtpService,
  RevokedTokenService,
  SessionService,
} from '@app/shared-utils';
import {
  CreateUserDto,
  findUserByEmailDto,
  findUserByPhoneDto,
  ProfileService,
  UserService,
} from '@app/user';
import { AccountManagementService } from '@app/user';
import { EntityManager } from '@mikro-orm/postgresql';
import { FastifyRequest } from 'fastify';

@Injectable()
export class AuthService {
  constructor(
    private readonly commonService: CommonService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly kavenegarService: KavenegarService,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly sessionService: SessionService,
    private readonly deviceService: DevicesService,
    private readonly securityService: SecurityService,
    private readonly revokedTokenService: RevokedTokenService,
    private readonly logger: LoggerService,
    private readonly em: EntityManager,
    private readonly config: ConfigService,
    private readonly accountManagementService: AccountManagementService,
  ) {}

  async sendOtpPhone(req: FastifyRequest, dto: SendOtpPhoneDto) {
    const findUserByPhoneDto: findUserByPhoneDto = {
      countryCode: dto.country_code,
      phoneNumber: dto.phone_no,
    };
    const user: UserEntity | null =
      await this.userService.findUserByPhone(findUserByPhoneDto);

    //  Proper time-window based rate limiting
    await this.enforceOtpRateLimit(dto.country_code, dto.phone_no);

    const createOtpDto: CreateOtpDto = {
      user: user,
      identifier: OtpIdentifier.PHONE,
      purpose: dto.type,
      deliveryMethod: OtpDeliveryMethod.SMS,
      userAgent: CommonService.getRequesterUserAgent(req),
      ipAddress: CommonService.getRequesterIpAddress(req),
      countryCode: dto.country_code,
      phoneNumber: dto.phone_no,
    };

    const otp = await this.otpService.createOtp(createOtpDto);

    this.logger.info('otp', { otp });

    // Use transaction for OTP creation and SMS sending
    return await this.executeOtpTransaction(dto, otp, req);
  }

  private async executeOtpTransaction(
    dto: SendOtpPhoneDto,
    otp: string,
    req: FastifyRequest,
  ) {
    return await this.em.transactional(async (em) => {
      const smsResult = await this.kavenegarService.sendOtpBySms(
        dto.phone_no,
        otp,
      );

      if (!smsResult) {
        // Clean up the created OTP if SMS fails
        try {
          await this.otpService.deleteOtp();
        } catch (error) {
          this.logger.error('Failed to cleanup OTP after SMS failure', {
            error,
          });
        }
        throw new Error('SMS sending failed');
      }

      // 6. Create security event
      try {
        const createSecurityEventDto: CreateSecurityEventDto = {
          user: null,
          req: req,
          session: null,
          eventType: 'otp_sent',
          eventCategory: 'auth',
          severity: Severity.LOW,
        };
        await this.securityService.createSecurityEvent(createSecurityEventDto);
      } catch (error) {
        this.logger.error('Failed to create security event', { error });
      }

      return { status: 'success', message: 'OTP sent successfully.' };
    });
  }

  async loginPhone(req: FastifyRequest, dto: LoginPhoneDto) {
    //  Check time-window based rate limiting for login attempts
    await this.enforceLoginRateLimit(dto.country_code, dto.phone_no);

    //1. Check if OTP exists and is valid
    const findOtpDto: FindOtpDto = {
      identifier: OtpIdentifier.PHONE,
      purpose: OtpPurpose.LOGIN,
      countryCode: dto.country_code,
      phoneNumber: dto.phone_no,
    };

    const otp = await this.otpService.findOtp(findOtpDto);
    if (!otp) {
      return { status: 'error', message: 'invalid_otp' };
    }

    const valid = await this.commonService.compare(dto.otp, otp.otpHash);
    if (!valid) {
      otp.attempts += 1;
      if (otp.attempts >= otp.maxAttempts) {
        otp.expiresAt = new Date(); // immediately expire
      }
      await this.otpService.updateOtp(otp.id, otp);

      // Increment login rate limit with proper time-window handling
      await this.incrementLoginRateLimit(dto.country_code, dto.phone_no);

      throw new BadRequestException('invalid_otp');
    }

    // Mark OTP as used after successful verification
    otp.isUsed = true;
    otp.verifiedAt = new Date();
    await this.otpService.updateOtp(otp.id, otp);

    // Use transaction for all database operations
    return await this.executeLoginTransaction(req, dto);
  }

  private async executeLoginTransaction(
    req: FastifyRequest,
    dto: LoginPhoneDto,
  ) {
    return await this.em.transactional(async (em) => {
      const findUserByPhoneDto: findUserByPhoneDto = {
        countryCode: dto.country_code,
        phoneNumber: dto.phone_no,
      };

      // 2. Find or register the user
      let user: UserEntity | null =
        await this.userService.findUserByPhone(findUserByPhoneDto);
      let eventAction = 'login';

      if (!user) {
        // Register new user
        eventAction = 'register/login';

        const createUserDto: CreateUserDto = {
          countryCode: dto.country_code,
          phoneNumber: dto.phone_no,
        };

        user = await this.userService.createUser(createUserDto, req);

        if (!user) {
          throw new Error('Failed to create user');
        }

        // Create profile for new user
        try {
          const profile = await this.profileService.createProfile(user);
          if (!profile) {
            this.logger.info('Failed to create profile for user', {
              userId: user.id,
            });
          }
        } catch (error) {
          this.logger.error('Error creating profile for user', {
            userId: user.id,
            error,
          });
          // Continue with login even if profile creation fails
        }
      } else {
        // Validate existing user status before allowing login
        this.validateUserStatus(user);

        // Update phone verified if not set
        if (!user.phoneVerifiedAt) {
          const updateUserDto: Partial<UserEntity> = {
            phoneVerifiedAt: new Date(),
          };
          await this.userService.updateUser(user.id, updateUserDto);
        }
      }

      // 3. Create device with security validation
      const device = await this.deviceService.createDevice(user, req);

      // Additional security check: Ensure device is safe for authentication
      const isDeviceSafe = await this.deviceService.isDeviceSafeForAuth(
        Number(device.id),
        Number(user.id),
      );

      if (!isDeviceSafe) {
        // Log security event for unsafe device usage attempt
        const createSecurityEventDto: CreateSecurityEventDto = {
          user: user,
          req: req,
          session: null,
          eventType: 'unsafe_device_attempt',
          eventCategory: 'security',
          severity: Severity.HIGH,
        };
        await this.securityService.createSecurityEvent(createSecurityEventDto);

        throw new BadRequestException(
          'Device not authorized for authentication',
        );
      }

      // 4. Create session with both user and device session limit enforcement
      const maxSessionsPerUser = this.config.getOrThrow<number>(
        'session.maxSessionsPerUser',
      );
      const maxSessionsPerDevice = this.config.getOrThrow<number>(
        'session.maxSessionsPerDevice',
      );

      const session = await this.sessionService.createSessionWithLimits(
        user,
        device,
        req,
        maxSessionsPerUser,
        maxSessionsPerDevice,
      );

      // 6. Issue tokens
      const accessToken = await this.jwtService.issueAccessToken(user, session);
      const { refreshToken } = await this.jwtService.issueRefreshToken(
        user,
        session,
      );

      // 7. Update session with refresh token
      session.refreshTokenHash = await this.commonService.hash(refreshToken);
      await this.sessionService.updateBySessionId(session);

      // 8. Create security event
      const createSecurityEventDto: CreateSecurityEventDto = {
        user: user,
        req: req,
        session: session,
        eventType: 'login',
        eventCategory: 'auth',
        severity: Severity.LOW,
      };
      await this.securityService.createSecurityEvent(createSecurityEventDto);

      return {
        status: 'success',
        data: {
          user_id: String(user.id),
          session_id: String(session.sessionId),
          access_token: accessToken,
          token_type: 'bearer',
          refresh_token: refreshToken,
          action: eventAction,
        },
      };
    });
  }

  async refreshToken(req: FastifyRequest) {
    try {
      const session = (req as any).user;

      // Validate user status before allowing token refresh
      this.validateUserStatus(session.user);

      const accessToken = await this.jwtService.issueAccessToken(
        session.user,
        session,
      );

      const { refreshToken: newRefreshToken, expiresIn } =
        await this.jwtService.issueRefreshToken(session.user, session);

      session.expiresAt = new Date(Date.now() + expiresIn * 1000); // 15 days
      session.lastActivityAt = new Date();
      session.userAgent = CommonService.getRequesterUserAgent(req);
      session.ipAddress = CommonService.getRequesterIpAddress(req);

      session.refreshTokenHash = await this.commonService.hash(newRefreshToken);
      await this.sessionService.updateBySessionId(session);

      // Log security event for token refresh
      const createSecurityEventDto: CreateSecurityEventDto = {
        user: session.user,
        req: req,
        session: session,
        eventType: 'refresh',
        eventCategory: 'auth',
        severity: Severity.INFO,
      };
      await this.securityService.createSecurityEvent(createSecurityEventDto);

      return {
        status: 'success',
        data: {
          session_id: String(session.sessionId),
          access_token: accessToken,
          refresh_token: newRefreshToken,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(req: FastifyRequest) {
    const session = (req as any).user;

    // Validate user status before allowing logout
    this.validateUserStatus(session.user);

    session.terminatedAt = new Date();
    session.terminationReason = SessionTerminationReason.LOGOUT;
    await this.sessionService.updateBySessionId(session);
    await this.deviceService.updateDevice(session.device);
    await this.revokedTokenService.createRevokedToken(
      session,
      RevocationReason.LOGOUT,
    );
    const createSecurityEventDto: CreateSecurityEventDto = {
      user: session.user,
      req: req,
      session: session,
      eventType: 'logout',
      eventCategory: 'auth',
      severity: Severity.INFO,
    };
    await this.securityService.createSecurityEvent(createSecurityEventDto);
    return {
      status: 'success',
      message: 'You have been successfully logged out!',
    };
  }

  /**
   * Send OTP via email
   * Equivalent to PHP: send_otp_by_email
   * @param req - Fastify request
   * @param dto - Email OTP request data
   * @returns OTP sending result
   */
  async sendOtpEmail(req: FastifyRequest, dto: SendOtpEmailDto) {
    // Validate email format
    if (!dto.email || !this.isValidEmail(dto.email)) {
      throw new BadRequestException('Invalid email address');
    }

    // Find existing user by email
    const findUserByEmailDto: findUserByEmailDto = {
      email: dto.email,
    };
    const user: UserEntity | null =
      await this.userService.findUserByEmail(findUserByEmailDto);

    // Enforce email OTP rate limiting
    await this.enforceEmailOtpRateLimit(dto.email);

    // Create OTP for email
    const createOtpDto: CreateOtpDto = {
      user: user,
      identifier: OtpIdentifier.EMAIL,
      purpose: dto.type || OtpPurpose.LOGIN,
      deliveryMethod: OtpDeliveryMethod.EMAIL,
      userAgent: CommonService.getRequesterUserAgent(req),
      ipAddress: CommonService.getRequesterIpAddress(req),
    };

    const otp = await this.otpService.createOtp(createOtpDto);

    this.logger.info('Email OTP created', { email: dto.email, otp });

    // Use transaction for OTP creation and email sending
    return await this.executeEmailOtpTransaction(dto, otp, req);
  }

  /**
   * Login with email OTP (one-click email authentication)
   * Equivalent to PHP: one_click_email
   * @param req - Fastify request
   * @param dto - Email login data
   * @returns Login result with tokens
   */
  async loginEmail(req: FastifyRequest, dto: LoginEmailDto) {
    // Validate email format
    if (!dto.email || !this.isValidEmail(dto.email)) {
      throw new BadRequestException('Invalid email address');
    }

    // Enforce email login rate limiting
    await this.enforceEmailLoginRateLimit(dto.email);

    // Find and validate OTP
    const findOtpDto: FindOtpDto = {
      identifier: OtpIdentifier.EMAIL,
      purpose: OtpPurpose.LOGIN,
    };

    const otp = await this.otpService.findOtp(findOtpDto);
    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Verify OTP
    const valid = await this.commonService.compare(dto.otp, otp.otpHash);
    if (!valid) {
      // Increment OTP attempts
      otp.attempts += 1;
      if (otp.attempts >= otp.maxAttempts) {
        otp.expiresAt = new Date(); // Immediately expire
      }
      await this.otpService.updateOtp(otp.id, otp);

      // Increment login rate limit
      await this.incrementEmailLoginRateLimit(dto.email);

      throw new BadRequestException('Invalid OTP');
    }

    // Mark OTP as used
    otp.isUsed = true;
    otp.verifiedAt = new Date();
    await this.otpService.updateOtp(otp.id, otp);

    // Execute login transaction
    return await this.executeEmailLoginTransaction(req, dto);
  }

  /**
   * Execute email OTP transaction (creation + sending)
   */
  private async executeEmailOtpTransaction(
    dto: SendOtpEmailDto,
    otp: string,
    req: FastifyRequest,
  ) {
    return await this.em.transactional(async (em) => {
      // Send email OTP
      const emailResult = await this.sendEmailOtp(dto.email, otp);

      if (!emailResult) {
        // Clean up the created OTP if email fails
        try {
          await this.otpService.deleteOtp();
        } catch (error) {
          this.logger.error('Failed to cleanup OTP after email failure', {
            error,
          });
        }
        throw new BadRequestException('Email sending failed');
      }

      // Create security event
      try {
        const createSecurityEventDto: CreateSecurityEventDto = {
          user: null,
          req: req,
          session: null,
          eventType: 'email_otp_sent',
          eventCategory: 'auth',
          severity: Severity.LOW,
        };
        await this.securityService.createSecurityEvent(createSecurityEventDto);
      } catch (error) {
        this.logger.error('Failed to create security event', { error });
      }

      return { status: 'success', message: 'Email OTP sent successfully.' };
    });
  }

  /**
   * Execute email login transaction
   */
  private async executeEmailLoginTransaction(
    req: FastifyRequest,
    dto: LoginEmailDto,
  ) {
    return await this.em.transactional(async (em) => {
      // Find or create user
      const findUserByEmailDto: findUserByEmailDto = {
        email: dto.email,
      };
      let user: UserEntity | null =
        await this.userService.findUserByEmail(findUserByEmailDto);
      let eventAction = 'login';

      if (!user) {
        // Auto-register new user
        eventAction = 'register/login';

        const createUserDto: CreateUserDto = {
          email: dto.email,
        };

        user = await this.userService.createUser(createUserDto, req);

        if (!user) {
          throw new Error('Failed to create user');
        }

        // Create profile for new user
        try {
          const profile = await this.profileService.createProfile(user);
          if (!profile) {
            this.logger.info('Failed to create profile for user', {
              userId: user.id,
            });
          }
        } catch (error) {
          this.logger.error('Error creating profile for user', {
            userId: user.id,
            error,
          });
        }
      } else {
        // Validate existing user status before allowing login
        this.validateUserStatus(user);

        // Update email verified if not set
        if (!user.emailVerifiedAt) {
          const updateUserDto: Partial<UserEntity> = {
            emailVerifiedAt: new Date(),
          };
          await this.userService.updateUser(user.id, updateUserDto);
        }
      }

      // Create device with security validation
      const device = await this.deviceService.createDevice(user, req);

      // Check device safety
      const isDeviceSafe = await this.deviceService.isDeviceSafeForAuth(
        Number(device.id),
        Number(user.id),
      );

      if (!isDeviceSafe) {
        // Log security event for unsafe device
        const createSecurityEventDto: CreateSecurityEventDto = {
          user: user,
          req: req,
          session: null,
          eventType: 'unsafe_device_attempt',
          eventCategory: 'security',
          severity: Severity.HIGH,
        };
        await this.securityService.createSecurityEvent(createSecurityEventDto);

        throw new BadRequestException(
          'Device not authorized for authentication',
        );
      }

      // Create session with limits
      const maxSessionsPerUser = this.config.getOrThrow<number>(
        'session.maxSessionsPerUser',
      );
      const maxSessionsPerDevice = this.config.getOrThrow<number>(
        'session.maxSessionsPerDevice',
      );

      const session = await this.sessionService.createSessionWithLimits(
        user,
        device,
        req,
        maxSessionsPerUser,
        maxSessionsPerDevice,
      );

      // Issue tokens
      const accessToken = await this.jwtService.issueAccessToken(user, session);
      const { refreshToken } = await this.jwtService.issueRefreshToken(
        user,
        session,
      );

      // Update session with refresh token
      session.refreshTokenHash = await this.commonService.hash(refreshToken);
      await this.sessionService.updateBySessionId(session);

      // Create security event
      const createSecurityEventDto: CreateSecurityEventDto = {
        user: user,
        req: req,
        session: session,
        eventType: 'email_login',
        eventCategory: 'auth',
        severity: Severity.LOW,
      };
      await this.securityService.createSecurityEvent(createSecurityEventDto);

      return {
        status: 'success',
        data: {
          user_id: String(user.id),
          session_id: String(session.sessionId),
          access_token: accessToken,
          token_type: 'bearer',
          refresh_token: refreshToken,
          action: eventAction,
        },
      };
    });
  }

  /**
   * Send email OTP using email service
   */
  private async sendEmailOtp(email: string, otp: string): Promise<boolean> {
    try {
      // TODO: Implement email service integration
      // This should use your email service (Nodemailer, SendGrid, etc.)
      // For now, we'll simulate success
      this.logger.info('Email OTP would be sent', { email, otp });

      // Example implementation:
      // return await this.emailService.sendOtpEmail(email, otp);

      return true; // Simulate success
    } catch (error) {
      this.logger.error('Failed to send email OTP', { email, error });
      return false;
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate username from email
   */
  private generateUsernameFromEmail(email: string): string {
    const baseUsername = email.split('@')[0];
    const timestamp = Date.now().toString().slice(-4);
    return `${baseUsername}_${timestamp}`;
  }

  /**
   * Enforce email OTP rate limiting
   */
  private async enforceEmailOtpRateLimit(email: string): Promise<void> {
    const identifier = `email_${email}`;
    const now = new Date();

    const findRateLimitDto: FindRateLimitDto = {
      identifier,
      limitType: 'email_otp',
    };

    let rateLimit = await this.securityService.findRateLimit(findRateLimitDto);

    if (rateLimit) {
      // Check if rate limit window has expired
      if (now > rateLimit.windowEnd) {
        // Window expired - Reset the rate limit
        const resetData = {
          attempts: 1,
          windowStart: now,
          windowEnd: new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes
        };
        await this.securityService.updateRateLimit(rateLimit.id, resetData);
        return;
      }

      // Window is still active - Check if limit exceeded
      if (rateLimit.attempts >= rateLimit.maxAttempts) {
        const minutesRemaining = Math.ceil(
          (rateLimit.windowEnd.getTime() - now.getTime()) / (1000 * 60),
        );

        throw new BadRequestException(
          `Too many email OTP requests. Please wait ${minutesRemaining} minutes before trying again.`,
        );
      }

      // Increment attempts within the active window
      rateLimit.attempts += 1;
      await this.securityService.updateRateLimit(rateLimit.id, {
        attempts: rateLimit.attempts,
      });
    } else {
      // Create new rate limit record
      const createRateLimitDto = {
        identifier,
        limitType: 'email_otp',
        scope: RateLimitScope.GLOBAL,
        attempts: 1,
        maxAttempts: 5, // 5 attempts per 15-minute window
        windowStart: now,
        windowEnd: new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes
        windowSeconds: 900,
      };

      await this.securityService.createRateLimit(createRateLimitDto);
    }
  }

  /**
   * Enforce email login rate limiting
   */
  private async enforceEmailLoginRateLimit(email: string): Promise<void> {
    const identifier = `email_login_${email}`;
    const now = new Date();

    const findRateLimitDto: FindRateLimitDto = {
      identifier,
      limitType: 'email_login',
    };

    const rateLimit =
      await this.securityService.findRateLimit(findRateLimitDto);

    if (rateLimit) {
      // Check if rate limit window has expired
      if (now > rateLimit.windowEnd) {
        // Window expired - Reset the rate limit
        const resetData = {
          attempts: 0,
          windowStart: now,
          windowEnd: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
        };
        await this.securityService.updateRateLimit(rateLimit.id, resetData);
        return;
      }

      // Window is still active - Check if limit exceeded
      if (rateLimit.attempts >= rateLimit.maxAttempts) {
        const minutesRemaining = Math.ceil(
          (rateLimit.windowEnd.getTime() - now.getTime()) / (1000 * 60),
        );

        throw new BadRequestException(
          `Too many failed email login attempts. Please wait ${minutesRemaining} minutes before trying again.`,
        );
      }
    }
  }

  /**
   * Increment email login rate limit
   */
  private async incrementEmailLoginRateLimit(email: string): Promise<void> {
    const identifier = `email_login_${email}`;
    const now = new Date();

    const findRateLimitDto: FindRateLimitDto = {
      identifier,
      limitType: 'email_login',
    };

    let rateLimit = await this.securityService.findRateLimit(findRateLimitDto);

    if (rateLimit) {
      // Check if window expired
      if (now > rateLimit.windowEnd) {
        // Reset window and start with 1 failed attempt
        const resetData = {
          attempts: 1,
          windowStart: now,
          windowEnd: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
        };
        await this.securityService.updateRateLimit(rateLimit.id, resetData);
      } else {
        // Increment attempts within active window
        rateLimit.attempts += 1;
        await this.securityService.updateRateLimit(rateLimit.id, {
          attempts: rateLimit.attempts,
        });
      }
    } else {
      // Create new rate limit record for failed email login
      const createEmailLoginRateLimitDto = {
        identifier,
        limitType: 'email_login',
        scope: RateLimitScope.GLOBAL,
        attempts: 1,
        maxAttempts: 10, // 10 failed attempts per hour
        windowStart: now,
        windowEnd: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
        windowSeconds: 3600,
      };

      await this.securityService.createRateLimit(createEmailLoginRateLimitDto);
    }
  }

  /**
   * FIXED: Proper time-window based rate limiting for OTP requests
   * Prevents permanent blocking by using sliding time windows
   */
  private async enforceOtpRateLimit(
    countryCode: string,
    phoneNumber: string,
  ): Promise<void> {
    const identifier = `${countryCode}${phoneNumber}`;
    const now = new Date();

    const findRateLimitDto: FindRateLimitDto = {
      identifier,
      limitType: 'otp',
    };

    let rateLimit = await this.securityService.findRateLimit(findRateLimitDto);

    if (rateLimit) {
      // Check if rate limit window has expired
      if (now > rateLimit.windowEnd) {
        // Window expired - Reset the rate limit
        const resetData = {
          attempts: 1,
          windowStart: now,
          windowEnd: new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes
        };
        await this.securityService.updateRateLimit(rateLimit.id, resetData);

        console.info('Rate limit window reset', {
          identifier,
          previousAttempts: rateLimit.attempts,
          windowExpired: rateLimit.windowEnd,
        });
        return;
      }

      // Window is still active - Check if limit exceeded
      if (rateLimit.attempts >= rateLimit.maxAttempts) {
        const minutesRemaining = Math.ceil(
          (rateLimit.windowEnd.getTime() - now.getTime()) / (1000 * 60),
        );

        throw new BadRequestException(
          `Too many OTP requests. Please wait ${minutesRemaining} minutes before trying again.`,
        );
      }

      // Increment attempts within the active window
      rateLimit.attempts += 1;
      await this.securityService.updateRateLimit(rateLimit.id, {
        attempts: rateLimit.attempts,
      });

      console.info('OTP rate limit incremented', {
        identifier,
        attempts: rateLimit.attempts,
        maxAttempts: rateLimit.maxAttempts,
        windowEnd: rateLimit.windowEnd,
      });
    } else {
      // Create new rate limit record
      const createRateLimitDto = {
        identifier,
        limitType: 'otp',
        scope: RateLimitScope.GLOBAL,
        attempts: 1,
        maxAttempts: 5, // 5 attempts per 15-minute window
        windowStart: now,
        windowEnd: new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes
        windowSeconds: 900,
      };

      await this.securityService.createRateLimit(createRateLimitDto);

      console.info('New OTP rate limit created', {
        identifier,
        maxAttempts: createRateLimitDto.maxAttempts,
        windowDuration: '15 minutes',
      });
    }
  }

  /**
   * FIXED: Time-window based rate limiting for login attempts
   */
  private async enforceLoginRateLimit(
    countryCode: string,
    phoneNumber: string,
  ): Promise<void> {
    const identifier = `${countryCode}${phoneNumber}`;
    const now = new Date();

    const findRateLimitDto: FindRateLimitDto = {
      identifier,
      limitType: 'login',
    };

    const rateLimit =
      await this.securityService.findRateLimit(findRateLimitDto);

    if (rateLimit) {
      // Check if rate limit window has expired
      if (now > rateLimit.windowEnd) {
        // Window expired - Reset the rate limit (don't throw error)
        const resetData = {
          attempts: 0, // Reset to 0 for login checks
          windowStart: now,
          windowEnd: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
        };
        await this.securityService.updateRateLimit(rateLimit.id, resetData);
        return; // Allow the login attempt
      }

      // Window is still active - Check if limit exceeded
      if (rateLimit.attempts >= rateLimit.maxAttempts) {
        const minutesRemaining = Math.ceil(
          (rateLimit.windowEnd.getTime() - now.getTime()) / (1000 * 60),
        );

        throw new BadRequestException(
          `Too many failed login attempts. Please wait ${minutesRemaining} minutes before trying again.`,
        );
      }
    }
    // If no rate limit exists or limit not exceeded, allow the attempt
  }

  /**
   * FIXED: Increment login rate limit with time-window handling
   */
  private async incrementLoginRateLimit(
    countryCode: string,
    phoneNumber: string,
  ): Promise<void> {
    const identifier = `${countryCode}${phoneNumber}`;
    const now = new Date();

    const findRateLimitDto: FindRateLimitDto = {
      identifier,
      limitType: 'login',
    };

    let rateLimit = await this.securityService.findRateLimit(findRateLimitDto);

    if (rateLimit) {
      // Check if window expired
      if (now > rateLimit.windowEnd) {
        // Reset window and start with 1 failed attempt
        const resetData = {
          attempts: 1,
          windowStart: now,
          windowEnd: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
        };
        await this.securityService.updateRateLimit(rateLimit.id, resetData);
      } else {
        // Increment attempts within active window
        rateLimit.attempts += 1;
        await this.securityService.updateRateLimit(rateLimit.id, {
          attempts: rateLimit.attempts,
        });
      }
    } else {
      // Create new rate limit record for failed login
      const createLoginRateLimitDto = {
        identifier,
        limitType: 'login',
        scope: RateLimitScope.GLOBAL,
        attempts: 1,
        maxAttempts: 10, // 10 failed attempts per hour
        windowStart: now,
        windowEnd: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
        windowSeconds: 3600,
      };

      await this.securityService.createRateLimit(createLoginRateLimitDto);
    }

    console.info('Login rate limit incremented', {
      identifier,
      attempts: rateLimit ? rateLimit.attempts + 1 : 1,
      maxAttempts: rateLimit ? rateLimit.maxAttempts : 10,
    });
  }

  /**
   * Handle failed login attempt with automated security responses
   */
  private async handleFailedLoginAttempt(
    user: UserEntity,
    req: FastifyRequest,
  ): Promise<void> {
    // Increment failed login attempts
    const newFailedAttempts = user.failedLoginAttempts + 1;

    await this.userService.updateUser(user.id, {
      failedLoginAttempts: newFailedAttempts,
      updatedAt: new Date(),
    });

    // Log security event
    const createSecurityEventDto: CreateSecurityEventDto = {
      user: user,
      req: req,
      session: null,
      eventType: 'failed_login_attempt',
      eventCategory: 'security',
      severity: newFailedAttempts >= 5 ? Severity.HIGH : Severity.MEDIUM,
    };
    await this.securityService.createSecurityEvent(createSecurityEventDto);

    // Automated security responses based on failed attempts
    if (newFailedAttempts >= 10) {
      // Critical: Suspend account
      await this.accountManagementService.suspendUser(
        {
          userId: user.id,
          reason: 'Critical: 10+ failed login attempts',
          evidence: { failedAttempts: newFailedAttempts },
        },
        req,
      );

      throw new UnauthorizedException(
        'Account suspended due to multiple failed login attempts. Please contact support.',
      );
    } else if (newFailedAttempts >= 7) {
      // High: Lock account for 2 hours
      await this.accountManagementService.lockUserAccount(
        {
          userId: user.id,
          reason: 'High: 7+ failed login attempts',
          duration: 120, // 2 hours
          evidence: { failedAttempts: newFailedAttempts },
        },
        req,
      );

      throw new UnauthorizedException(
        'Account temporarily locked due to multiple failed login attempts. Please try again in 2 hours.',
      );
    } else if (newFailedAttempts >= 5) {
      // Medium: Lock account for 30 minutes
      await this.accountManagementService.lockUserAccount(
        {
          userId: user.id,
          reason: 'Medium: 5+ failed login attempts',
          duration: 30, // 30 minutes
          evidence: { failedAttempts: newFailedAttempts },
        },
        req,
      );

      throw new UnauthorizedException(
        'Account temporarily locked due to multiple failed login attempts. Please try again in 30 minutes.',
      );
    }
  }

  /**
   * Reset failed login attempts on successful login
   */
  private async resetFailedLoginAttempts(user: UserEntity): Promise<void> {
    if (user.failedLoginAttempts > 0) {
      await this.userService.updateUser(user.id, {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Validate user status for authentication
   * Only ACTIVE users can authenticate
   */
  private validateUserStatus(user: UserEntity): void {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    switch (user.status) {
      case UserStatus.ACTIVE:
        // User can authenticate
        break;
      case UserStatus.PENDING:
        throw new UnauthorizedException(
          'Account is pending activation. Please contact support.',
        );
      case UserStatus.SUSPENDED:
        throw new UnauthorizedException(
          'Account is suspended. Please contact support.',
        );
      case UserStatus.DELETED:
        throw new UnauthorizedException('Account has been deleted.');
      default:
        throw new UnauthorizedException('Invalid account status.');
    }

    // Additional check for locked accounts
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account is temporarily locked. Please try again later.',
      );
    }
  }
}
