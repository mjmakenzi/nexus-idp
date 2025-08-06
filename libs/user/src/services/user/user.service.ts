import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserRepository } from '@app/db';
import { UserEntity } from '@app/db';
import { CommonService } from '@app/shared-utils';
import { CreateUserDto, findUserByPhoneDto } from '../../dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly commonService: CommonService,
  ) {}

  async createUser(dto: CreateUserDto) {
    const username = this.commonService.generateRandomUserName();
    const { passwordHash, passwordSalt } =
      await this.commonService.generateRandomPassword();

    const createUserDto: Partial<UserEntity> = {
      countryCode: dto.countryCode,
      phoneNumber: dto.phoneNumber,
      username: username,
      passwordHash: passwordHash,
      passwordSalt: passwordSalt,
      phoneVerifiedAt: new Date(),
    };

    const user = await this.userRepository.createUser(createUserDto);

    return user;
  }

  async findUserByPhone(dto: findUserByPhoneDto): Promise<UserEntity | null> {
    return await this.userRepository.findUserByPhone(dto);
  }

  async findUserById(id: number): Promise<UserEntity | null> {
    return await this.userRepository.getUserById(id);
  }

  async updateUser(id: bigint, dto: Partial<UserEntity>) {
    return await this.userRepository.updateUser(id, dto);
  }
}
