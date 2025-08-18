import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '@app/db';
import { SessionModule } from '@app/shared-utils';
import { LoggerModule } from '@app/shared-utils';
import { resolve } from 'path';
import { adminConfig } from './admin.config';
import { AdminController } from './admin.controller';
import { adminSchema } from './admin.schema';
import { AdminService } from './admin.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), '.env'),
      load: [adminConfig],
      validationSchema: adminSchema,
    }),
    DbModule,
    LoggerModule,
    SessionModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
