import {
  BaseEntity,
  Cascade,
  Entity,
  EntityRepositoryType,
  Index,
  OneToOne,
  OptionalProps,
  PrimaryKey,
  Property,
  Unique,
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
  @PrimaryKey({ type: 'bigint', autoincrement: true })
  id!: bigint;

  @OneToOne(() => UserEntity, {
    fieldName: 'user_id',
    nullable: false,
    owner: true,
  })
  user!: UserEntity;

  @Property({
    fieldName: 'user_data_key',
    serializedName: 'user_data_key',
    nullable: false,
    type: 'varchar',
    length: 100,
  })
  @Unique()
  @Index({ name: 'idx_user_data_key' })
  userDataKey!: string;

  @Property({
    fieldName: 'first_name',
    serializedName: 'first_name',
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  firstName?: string;

  @Property({
    fieldName: 'last_name',
    serializedName: 'last_name',
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  lastName?: string;

  @Property({
    fieldName: 'display_name',
    serializedName: 'display_name',
    nullable: true,
    type: 'varchar',
    length: 200,
  })
  @Index({ name: 'idx_display_name' })
  displayname?: string;

  @Property({
    fieldName: 'bio',
    serializedName: 'bio',
    nullable: true,
    type: 'text',
    length: 1000,
  })
  bio?: string;

  @Property({
    fieldName: 'date_of_birth',
    serializedName: 'date_of_birth',
    nullable: true,
    type: 'date',
  })
  dateOfBirth?: Date;

  @Property({
    fieldName: 'gender',
    serializedName: 'gender',
    nullable: true,
    type: 'varchar',
    length: 50,
  })
  gender?: string;

  @Property({
    fieldName: 'avatar_file_name',
    serializedName: 'avatar_file_name',
    nullable: true,
    type: 'varchar',
    length: 500,
  })
  avatarFileName?: string;

  @Property({
    fieldName: 'cover_file_name',
    serializedName: 'cover_file_name',
    nullable: true,
    type: 'varchar',
    length: 500,
  })
  coverFileName?: string;

  @Property({
    fieldName: 'website',
    serializedName: 'website',
    nullable: true,
    type: 'varchar',
    length: 500,
  })
  website?: string;

  @Property({
    fieldName: 'social_links',
    serializedName: 'social_links',
    type: 'json',
    nullable: true,
  })
  socialLinks?: Record<string, string>;

  @Property({
    fieldName: 'apple_uid',
    serializedName: 'apple_uid',
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  appleUid?: string;

  @Property({
    fieldName: 'google_id',
    serializedName: 'google_id',
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  googleId?: string;

  @Property({
    fieldName: 'timezone',
    serializedName: 'timezone',
    nullable: true,
    type: 'varchar',
    default: 'utc',
    length: 50,
  })
  timezone?: string;

  @Property({
    fieldName: 'locale',
    serializedName: 'locale',
    nullable: true,
    default: 'en-US',
    type: 'varchar',
    length: 10,
  })
  locale?: string;

  @Property({
    fieldName: 'preferred_language',
    serializedName: 'preferred_language',
    nullable: true,
    type: 'varchar',
    length: 10,
  })
  preferredLanguage?: string;

  @Property({
    fieldName: 'preferences',
    serializedName: 'preferences',
    type: 'json',
    nullable: true,
  })
  preferences?: Record<string, unknown>;

  @Property({
    fieldName: 'created_at',
    serializedName: 'created_at',
    type: 'timestamp',
    nullable: false,
  })
  createdAt: Date = new Date();

  @Property({
    fieldName: 'updated_at',
    serializedName: 'updated_at',
    type: 'timestamp',
    nullable: false,
  })
  updatedAt: Date = new Date();
}
