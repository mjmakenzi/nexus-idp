import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
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
    LoggerModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
