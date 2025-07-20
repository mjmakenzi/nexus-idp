/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { LoadStrategy, Options } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SeedManager } from '@mikro-orm/seeder';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { AuditLogEntity } from './entities/audit-log.entity';
import { DeviceEntity } from './entities/device.entity';
import { OtpEntity } from './entities/otp.entity';
import { ProfileEntity } from './entities/profile.entity';
import { RevokedTokenEntity } from './entities/revoked-token.entity';
import { SessionEntity } from './entities/session.entity';
import { UserEntity } from './entities/user.entity';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const baseDir = process.cwd();

const config: Options<PostgreSqlDriver> = defineConfig({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  dbName:
    process.env.NODE_ENV !== 'test'
      ? process.env.DATABASE_NAME
      : process.env.DATABASE_NAME + '_test',
  baseDir,
  extensions: [Migrator, SeedManager],
  entities: [
    AuditLogEntity,
    RevokedTokenEntity,
    SessionEntity,
    DeviceEntity,
    UserEntity,
    OtpEntity,
    ProfileEntity,
  ],
  loadStrategy: LoadStrategy.JOINED,
  migrations: {
    path: './dist/libs/db/migrations',
    pathTs: './libs/db/src/migrations',
    disableForeignKeys: false,
  },
  seeder: {
    path: './dist/libs/db/seeders',
    pathTs: './libs/db/src/seeders',
  },
  metadataCache: {
    options: {
      cacheDir: resolve(baseDir, './temp/db'),
    },
  },
  metadataProvider: TsMorphMetadataProvider,
  ignoreUndefinedInQuery: true,
  debug: !['production', 'test'].includes(process.env.NODE_ENV!),
});

export default config;
