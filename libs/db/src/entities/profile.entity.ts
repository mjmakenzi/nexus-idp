import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  OneToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { ProfileRepository } from '../repositories/profile.repository';
import { UserEntity } from './user.entity';

/**
 * User profile entity containing extended personal and preference information.
 *
 * This entity handles:
 * - Personal identification (name, avatar, bio)
 * - Contact and location information
 * - Social media and web presence
 * - User preferences and settings
 * - Internationalization settings (locale, timezone, language)
 * - Profile customization and branding
 */
@Entity({ tableName: 'profiles', repository: () => ProfileRepository })
export class ProfileEntity extends BaseEntity {
  [EntityRepositoryType]?: ProfileRepository;

  /**
   * Optional properties that can be undefined during entity creation/updates.
   * Most profile fields are optional as users may not provide all information initially.
   */
  [OptionalProps]?:
    | 'firstName' // User's first/given name
    | 'lastName' // User's last/family name
    | 'middleName' // User's middle name
    | 'displayName' // Public display name (defaults to "کاربر تازه‌وارد")
    | 'nickname' // Informal nickname or alias
    | 'avatarUrl' // Profile picture URL
    | 'coverUrl' // Profile cover/banner image URL
    | 'bio' // User biography or description
    | 'dateOfBirth' // User's birth date
    | 'gender' // User's gender identity
    | 'website' // Personal website URL
    | 'socialLinks' // Social media profile links
    | 'addressLine1' // Primary address line
    | 'addressLine2' // Secondary address line
    | 'city' // City of residence
    | 'state' // State/province of residence
    | 'postalCode' // Postal/ZIP code
    | 'country' // Country of residence
    | 'timezone' // User's timezone
    | 'locale' // User's locale preference
    | 'preferredLanguage' // User's preferred language
    | 'preferences'; // User preferences and settings

  /** Unique identifier for the profile record */
  @PrimaryKey()
  id!: number;

  /**
   * Associated user account (one-to-one relationship).
   * Each user has exactly one profile.
   */
  @OneToOne(() => UserEntity, { name: 'user_id' })
  user!: UserEntity;

  /**
   * User's first/given name.
   * Used for personalization and formal communications.
   */
  @Property({ name: 'first_name', nullable: true })
  firstName?: string;

  /**
   * User's last/family name.
   * Used for personalization and formal communications.
   */
  @Property({ name: 'last_name', nullable: true })
  lastName?: string;

  /**
   * User's middle name or initial.
   * Optional field for complete name representation.
   */
  @Property({ name: 'middle_name', nullable: true })
  middleName?: string;

  /**
   * Public display name shown to other users.
   * Defaults to "کاربر تازه‌وارد" (New User in Persian) for new accounts.
   * Can be customized by the user.
   */
  @Property({ nullable: true, default: 'کاربر تازه‌وارد' })
  displayname?: string;

  /**
   * Informal nickname or alias chosen by the user.
   * Used for casual interactions and personal branding.
   */
  @Property({ nullable: true })
  nickname?: string;

  /**
   * URL to the user's profile picture/avatar.
   * Used for visual identification and personalization.
   */
  @Property({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  /**
   * URL to the user's profile cover/banner image.
   * Used for profile customization and branding.
   */
  @Property({ name: 'cover_url', nullable: true })
  coverUrl?: string;

  /**
   * User's biography or personal description.
   * Long text field for self-introduction and personal branding.
   */
  @Property({ nullable: true, type: 'text' })
  bio?: string;

  /**
   * User's date of birth.
   * Used for age verification, birthday features, and compliance.
   */
  @Property({ name: 'date_of_birth', nullable: true })
  dateOfBirth?: Date;

  /**
   * User's gender identity.
   * Used for personalization and demographic analytics.
   */
  @Property({ nullable: true })
  gender?: string;

  /**
   * User's personal website URL.
   * Used for professional networking and personal branding.
   */
  @Property({ nullable: true })
  website?: string;

  /**
   * Social media profile links (Twitter, LinkedIn, Instagram, etc.).
   * Stored as JSON object with platform names as keys and URLs as values.
   */
  @Property({ name: 'social_links', type: 'json', nullable: true })
  socialLinks?: Record<string, string>;

  /**
   * Primary address line for shipping, billing, or location services.
   * Used for e-commerce, delivery, and location-based features.
   */
  @Property({ name: 'address_line1', nullable: true })
  addressLine1?: string;

  /**
   * Secondary address line (apartment, suite, etc.).
   * Additional address details for precise location.
   */
  @Property({ name: 'address_line2', nullable: true })
  addressLine2?: string;

  /**
   * City of residence.
   * Used for location-based services and regional features.
   */
  @Property({ nullable: true })
  city?: string;

  /**
   * State/province of residence.
   * Used for location-based services and regional features.
   */
  @Property({ nullable: true })
  state?: string;

  /**
   * Postal/ZIP code.
   * Used for shipping, billing, and location services.
   */
  @Property({ name: 'postal_code', nullable: true })
  postalCode?: string;

  /**
   * Country of residence.
   * Used for internationalization, compliance, and regional features.
   */
  @Property({ nullable: true })
  country?: string;

  /**
   * User's timezone (e.g., "America/New_York", "Europe/London").
   * Used for displaying local times and scheduling features.
   */
  @Property({ nullable: true })
  timezone?: string;

  /**
   * User's locale preference (e.g., "en-US", "fa-IR").
   * Used for internationalization and content localization.
   */
  @Property({ nullable: true })
  locale?: string;

  /**
   * User's preferred language for content and communications.
   * Used for multilingual support and content delivery.
   */
  @Property({ name: 'preferred_language', nullable: true })
  preferredLanguage?: string;

  /**
   * User preferences and settings stored as JSON.
   * Flexible storage for UI preferences, notification settings, etc.
   */
  @Property({ type: 'json', nullable: true })
  preferences?: Record<string, unknown>;

  /**
   * Timestamp when the profile was created.
   * Automatically set on entity creation.
   */
  @Property({ name: 'created_at', onCreate: () => new Date() })
  createdAt: Date = new Date();

  /**
   * Timestamp when the profile was last updated.
   * Automatically updated on any entity modification.
   */
  @Property({ name: 'updated_at', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
