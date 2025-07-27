import { Migration } from '@mikro-orm/migrations';

export class Migration20250726054041 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "rate_limits" ("id" serial primary key, "identifier" varchar(255) not null, "limit_type" varchar(255) not null, "scope" varchar(255) not null, "attempts" int not null, "max_attempts" int not null, "window_seconds" int not null, "window_start" timestamptz not null, "window_end" timestamptz not null, "blocked_until" timestamptz null, "ip_address" varchar(255) null, "json" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);

    this.addSql(`alter table "otps" add column "attempts" int not null default 0, add column "max_attempts" int not null default 5;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "rate_limits" cascade;`);

    this.addSql(`alter table "otps" drop column "attempts", drop column "max_attempts";`);
  }

}
