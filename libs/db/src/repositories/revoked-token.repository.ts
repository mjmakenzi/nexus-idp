import { EntityRepository } from '@mikro-orm/postgresql';
import { RevokedTokenEntity } from '../entities/revoked-token.entity';
import { UserEntity } from '../entities/user.entity';

export class RevokedTokenRepository extends EntityRepository<RevokedTokenEntity> {
  // async getRevokedToken(
  //   user: UserEntity,
  //   token: string,
  //   type: number,
  // ): Promise<RevokedTokenEntity | null> {
  //   return this.findOne({ user: user, token, type });
  // }
  // async createRevokedToken(
  //   user: UserEntity,
  //   refreshToken: string,
  //   type: number,
  //   userAgent: string,
  //   ip: string,
  //   expiredOn: Date,
  //   revokedOn: Date,
  // ): Promise<RevokedTokenEntity> {
  //   return this.create({
  //     user: user,
  //     token: refreshToken,
  //     type, // refresh token type
  //     userAgent,
  //     ip,
  //     expiredOn,
  //     revokedOn,
  //   });
  // }
}
