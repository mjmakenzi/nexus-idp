import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { ProfileRepository } from '../repositories/profile.repository';
import { UserEntity } from './user.entity';

@Entity({ tableName: 'profiles', repository: () => ProfileRepository })
export class ProfileEntity extends BaseEntity {
  [EntityRepositoryType]?: ProfileRepository;

  @PrimaryKey()
  id!: number;

  @OneToOne(() => UserEntity, { fieldName: 'user_id' })
  user!: UserEntity;

  @Property({ fieldName: 'first_name', nullable: true })
  firstName?: string;

  @Property({ fieldName: 'last_name', nullable: true })
  lastName?: string;

  @Property({
    fieldName: 'display_name',
    nullable: true,
    default: 'کاربر تازه‌وارد',
  })
  displayName?: string;

  @Property({ fieldName: 'avatar', type: 'json', nullable: true })
  avatar?: Record<string, string>;

  @Property({ fieldName: 'urls', type: 'json', nullable: true })
  urls?: Record<string, string>;

  @Property({ fieldName: 'bio', nullable: true })
  bio?: string;

  @Property({ fieldName: 'created_at' })
  createdAt: Date = new Date();

  @Property({ fieldName: 'updated_at', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
