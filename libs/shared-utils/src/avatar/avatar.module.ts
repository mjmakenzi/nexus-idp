import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MinioModule } from 'nestjs-minio-client';
import { IConfiguration } from './avatar.interface';
import { AvatarService } from './avatar.service';

@Module({
  imports: [
    ConfigModule,
    MinioModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const minioConfig =
          configService.getOrThrow<IConfiguration['minio']>('minio');
        return {
          endPoint: minioConfig.endpoint,
          port: minioConfig.port,
          useSSL: minioConfig.useSsl,
          accessKey: minioConfig.accessKey,
          secretKey: minioConfig.secretKey,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AvatarService],
  exports: [AvatarService],
})
export class AvatarModule {}
