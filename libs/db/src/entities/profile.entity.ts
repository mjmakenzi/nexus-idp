import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  OneToOne,
  OptionalProps,
  PrimaryKey,
  Property,
  SerializeOptions,
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
    | 'displayname' // Public display name (defaults to "کاربر تازه‌وارد")
    | 'avatarUrl' // Profile picture URL
    | 'bio' // User biography or description
    | 'socialLinks'; // Social media profile links

  /** Unique identifier for the profile record */
  @PrimaryKey()
  id!: number;

  /**
   * Associated user account (one-to-one relationship).
   * Each user has exactly one profile.
   */
  @OneToOne(() => UserEntity, { fieldName: 'user_id' })
  user!: UserEntity;

  /**
   * User's first/given name.
   * Used for personalization and formal communications.
   */
  @Property({
    fieldName: 'first_name',
    serializedName: 'first-name',
    nullable: true,
  })
  firstName?: string;

  /**
   * User's last/family name.
   * Used for personalization and formal communications.
   */
  @Property({
    fieldName: 'last_name',
    serializedName: 'last-name',
    nullable: true,
  })
  lastName?: string;

  /**
   * Public display name shown to other users.
   * Defaults to "کاربر تازه‌وارد" (New User in Persian) for new accounts.
   * Can be customized by the user.
   */
  @Property({
    fieldName: 'display_name',
    serializedName: 'display-name',
    nullable: true,
    default: 'کاربر تازه‌وارد',
  })
  displayname?: string;

  /**
   * URL to the user's profile picture/avatar.
   * Used for visual identification and personalization.
   */
  @Property({
    fieldName: 'avatar_url',
    serializedName: 'avatar-url',
    nullable: true,
  })
  avatarUrl?: string;

  /**
   * User's biography or personal description.
   * Long text field for self-introduction and personal branding.
   */
  @Property({
    nullable: true,
    type: 'text',
    serializer: (value: string) => (value ? value.trim() : value),
  })
  bio?: string;

  /**
   * User's date of birth.
   * Used for age verification, birthday features, and compliance.
   * NOT USED
   */
  // @Property({ name: 'date_of_birth', nullable: true })
  // dateOfBirth?: Date;

  /**
   * User's gender identity.
   * Used for personalization and demographic analytics.
   * NOT USED
   */
  // @Property({ nullable: true })
  // gender?: string;

  /**
   * Social media profile links (Twitter, LinkedIn, Instagram, etc.).
   * Stored as JSON object with platform names as keys and URLs as values.
   */
  @Property({
    fieldName: 'social_links',
    serializedName: 'social-links',
    type: 'json',
    nullable: true,
  })
  socialLinks?: Record<string, string>;

  /**
   * Primary address line for shipping, billing, or location services.
   * Used for e-commerce, delivery, and location-based features.
   * NOT USED
   */
  // @Property({ name: 'address_line1', nullable: true })
  // addressLine1?: string;

  /**
   * Secondary address line (apartment, suite, etc.).
   * Additional address details for precise location.
   * NOT USED
   */
  // @Property({ name: 'address_line2', nullable: true })
  // addressLine2?: string;

  /**
   * City of residence.
   * Used for location-based services and regional features.
   * NOT USED
   */
  // @Property({ nullable: true })
  // city?: string;

  /**
   * Postal/ZIP code.
   * Used for shipping, billing, and location services.
   * NOT USED
   */
  // @Property({ name: 'postal_code', nullable: true })
  // postalCode?: string;

  /**
   * Country of residence.
   * Used for internationalization, compliance, and regional features.
   * NOT USED
   */
  // @Property({ nullable: true })
  // country?: string;

  /**
   * User's timezone (e.g., "America/New_York", "Europe/London").
   * Used for displaying local times and scheduling features.
   * NOT USED
   */
  // @Property({ nullable: true })
  // timezone?: string;

  /**
   * User's locale preference (e.g., "en-US", "fa-IR").
   * Used for internationalization and content localization.
   * NOT USED
   */
  // @Property({ nullable: true })
  // locale?: string;

  /**
   * User's preferred language for content and communications.
   * Used for multilingual support and content delivery.
   * NOT USED
   */
  // @Property({ name: 'preferred_language', nullable: true })
  // preferredLanguage?: string;

  /**
   * User preferences and settings stored as JSON.
   * Flexible storage for UI preferences, notification settings, etc.
   */
  // @Property({ type: 'json', nullable: true })
  // preferences?: Record<string, unknown>;

  /**
   * Timestamp when the profile was created.
   * Automatically set on entity creation.
   */
  @Property({ fieldName: 'created_at', onCreate: () => new Date() })
  createdAt: Date = new Date();

  /**
   * Timestamp when the profile was last updated.
   * Automatically updated on any entity modification.
   */
  @Property({ fieldName: 'updated_at', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
