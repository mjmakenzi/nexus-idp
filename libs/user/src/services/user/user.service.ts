import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserEntity, UserRepository, UserStatus } from '@app/db';
import { CommonService } from '@app/shared-utils';
import { FastifyRequest } from 'fastify';
import {
  CreateUserDto,
  findUserByEmailDto,
  findUserByPhoneDto,
} from '../../dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly commonService: CommonService,
  ) {}

  async createUser(dto: CreateUserDto, req: FastifyRequest) {
    const username = this.commonService.generateRandomUserName();
    const { passwordHash, passwordSalt } =
      await this.commonService.generateRandomPassword();
    const now = new Date();

    const createUserDto: Partial<UserEntity> = {
      // Required fields
      username: username,
      passwordHash: passwordHash,
      passwordSalt: passwordSalt,
      passwordVersion: 1,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,

      // Optional fields with defaults
      passwordChangedAt: now,
      lastLoginAt: now,
      lastLoginIp: CommonService.getRequesterIpAddress(req),

      // Phone-related fields
      countryCode: dto.countryCode,
      phoneNumber: dto.phoneNumber,
      phone: dto.phoneNumber,
      phoneVerifiedAt: dto.phoneNumber ? now : undefined,
    };

    // Handle email if provided
    if (dto.email) {
      createUserDto.email = dto.email;
      createUserDto.emailNormalized = dto.email.toLowerCase().trim();
      createUserDto.emailVerifiedAt = now;
    }

    const user = await this.userRepository.createUser(createUserDto);

    return user;
  }

  async findUserByPhone(dto: findUserByPhoneDto): Promise<UserEntity | null> {
    return await this.userRepository.findUserByPhone(dto);
  }

  async findUserById(id: number): Promise<UserEntity | null> {
    return await this.userRepository.getUserById(id);
  }

  async findUserByEmail(dto: findUserByEmailDto): Promise<UserEntity | null> {
    return await this.userRepository.getUserByEmail(dto.email);
  }

  async updateUser(id: bigint, dto: Partial<UserEntity>) {
    return await this.userRepository.updateUser(id, dto);
  }
}
