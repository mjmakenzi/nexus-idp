import { Injectable } from '@nestjs/common';
import { UserRepository } from '@app/db';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
}
