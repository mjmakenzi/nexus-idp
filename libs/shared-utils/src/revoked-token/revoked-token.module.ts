import { Global, Module } from '@nestjs/common';
import { RevokedTokenEntity } from '@app/db';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RevokedTokenService } from './revoked-token.service';

@Global()
@Module({
  imports: [MikroOrmModule.forFeature([RevokedTokenEntity])],
  providers: [RevokedTokenService],
  exports: [RevokedTokenService],
})
export class RevokedTokenModule {}
