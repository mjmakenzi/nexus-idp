import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  Enum,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { OtpRepository } from '../repositories/otp.repository';
import { UserEntity } from './user.entity';

export enum OtpDeliveryMethod {
  SMS = 'sms',
  EMAIL = 'email',
  VOICE = 'voice',
  APP = 'app',
}

export enum OtpPurpose {
  LOGIN = 'login',
  REGISTER = 'register',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
}

export enum OtpIdentifier {
  EMAIL = 'email',
  PHONE = 'phone',
}

/**
 * OTP (One-Time Password) entity for managing temporary authentication codes.
 *
 * This entity handles:
 * - Temporary authentication codes for various purposes (login, registration, password reset)
 * - Multiple delivery methods (SMS, email, voice, app)
 * - Security tracking (attempts, expiration, verification)
 * - Audit trail (creation, verification, usage)
 * - Multi-step authentication flows
 */
@Entity({ tableName: 'otps', repository: () => OtpRepository })
export class OtpEntity extends BaseEntity {
  [EntityRepositoryType]?: OtpRepository;

  /**
   * Optional properties that can be undefined during entity creation/updates.
   * These are primarily nullable fields that may not be set initially.
   */
  [OptionalProps]?:
    | 'user' // Associated user (nullable for anonymous OTPs)
    | 'userAgent' // Browser/client information
    | 'ipAddress' // IP address of OTP request
    | 'verifiedAt' // Verification timestamp
    | 'createdAt' // Creation timestamp
    | 'stepNumber'; // Step number

  /** Unique identifier for the OTP record */
  @PrimaryKey()
  id!: number;

  /**
   * Associated user account (nullable for anonymous OTPs).
   * Used when OTP is sent to an existing user for authentication.
   * User relationship should be managed through the user module.
   */
  @ManyToOne(() => UserEntity, { nullable: true })
  user?: UserEntity;

  /**
   * Target identifier for OTP delivery (email address or phone number).
   * Used to determine where to send the OTP code.
   */
  @Property()
  @Enum(() => OtpIdentifier)
  identifier: OtpIdentifier = OtpIdentifier.PHONE; // email or phone

  /**
   * Hashed OTP code for security (never store plain text OTPs).
   * Generated using cryptographically secure methods.
   */
  @Property({ fieldName: 'otp_hash', serializedName: 'otp_hash' })
  otpHash!: string;

  /**
   * Purpose of the OTP (login, register, password_reset, email_verification, etc.).
   * Determines the validation rules and post-verification actions.
   */
  @Enum(() => OtpPurpose)
  purpose: OtpPurpose = OtpPurpose.LOGIN; // Enum string: login, register, etc.

  /**
   * Method used to deliver the OTP (email, sms, voice, app).
   * Determines the delivery mechanism and rate limiting rules.
   */
  @Property({ fieldName: 'delivery_method', serializedName: 'delivery_method' })
  @Enum(() => OtpDeliveryMethod)
  deliveryMethod: OtpDeliveryMethod = OtpDeliveryMethod.SMS; // e.g., email, sms, voice, app

  /**
   * Step number in multi-step authentication flows.
   * Defaults to 1 for single-step OTPs.
   * Used for complex authentication sequences.

   */
  @Property({
    fieldName: 'step_number',
    serializedName: 'step_number',
    default: 1,
  })
  stepNumber: number = 1;

  /**
   * Number of verification attempts made for this OTP.
   * Used to implement rate limiting and prevent brute force attacks.
   * NOT USED
   */
  @Property({ default: 0 })
  attempts: number = 0;

  /**
   * Maximum allowed verification attempts before OTP is invalidated.
   * Defaults to 5 attempts for security.
   * NOT USED
   */
  @Property({ name: 'max_attempts', default: 5 })
  maxAttempts: number = 5;

  /**
   * Additional context data for the OTP (device info, session data, etc.).
   * Stored as JSON for flexibility in storing various metadata.
   * NOT USED
   */
  // @Property({ type: 'json', nullable: true })
  // metadata?: Record<string, unknown>;

  /**
   * User agent string from the browser/client that requested the OTP.
   * Used for security monitoring and fraud detection.
   */
  @Property({
    fieldName: 'user_agent',
    serializedName: 'user_agent',
    nullable: true,
  })
  userAgent?: string;

  /**
   * IP address of the client that requested the OTP.
   * Used for security monitoring, rate limiting, and fraud detection.
   */
  @Property({
    fieldName: 'ip_address',
    serializedName: 'ip_address',
    nullable: true,
  })
  ipAddress?: string;

  /**
   * Timestamp when the OTP was created.
   * Automatically set on entity creation.
   */
  @Property({
    fieldName: 'created_at',
    serializedName: 'created_at',
    onCreate: () => new Date(),
  })
  createdAt: Date = new Date();

  /**
   * Timestamp when the OTP expires and becomes invalid.
   * OTPs typically expire after 5-15 minutes for security.
   */
  @Property({ fieldName: 'expires_at', serializedName: 'expires_at' })
  expiresAt!: Date;

  /**
   * Timestamp when the OTP was successfully verified.
   * Null until the OTP is verified by the user.
   */
  @Property({
    fieldName: 'verified_at',
    serializedName: 'verified_at',
    nullable: true,
  })
  verifiedAt?: Date;

  /**
   * Whether the OTP has been used for its intended purpose.
   * Prevents reuse of OTPs for security.
   * NOT USED
   */
  // @Property({ name: 'is_used', default: false })
  // isUsed: boolean = false;
}
