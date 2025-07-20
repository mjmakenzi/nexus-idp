import { Injectable } from '@nestjs/common';
import {
  ProfileEntity,
  ProfileRepository,
  UserEntity,
  UserRepository,
} from '@app/db';
import { EntityManager } from '@mikro-orm/postgresql';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly em: EntityManager,
  ) {}
}
