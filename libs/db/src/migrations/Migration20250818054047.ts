import { Migration } from '@mikro-orm/migrations';

export class Migration20250818054047 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "session_archives" ("id" bigserial primary key, "original_session_id" varchar(36) not null, "user_id" bigint not null, "device_id" bigint null, "session_id" varchar(36) not null, "access_token_hash" varchar(255) null, "refresh_token_hash" varchar(255) null, "granted_permissions" jsonb null, "user_agent" text null, "ip_address" varchar(45) null, "geo_location" jsonb null, "created_at" timestamptz not null, "last_activity_at" timestamptz not null, "expires_at" timestamptz not null, "max_expires_at" timestamptz not null, "terminated_at" timestamptz not null, "termination_reason" varchar(50) not null default 'archived', "is_remembered" boolean not null default false, "archived_at" timestamptz not null, "retention_days" int not null default 2555, "retention_expires_at" timestamptz not null);`);
    this.addSql(`create index "idx_original_session_id" on "session_archives" ("original_session_id");`);
    this.addSql(`create index "idx_archive_session_id" on "session_archives" ("session_id");`);
    this.addSql(`create index "idx_archive_last_activity" on "session_archives" ("last_activity_at");`);
    this.addSql(`create index "idx_archive_expires_at" on "session_archives" ("expires_at");`);
    this.addSql(`create index "idx_archive_terminated_at" on "session_archives" ("terminated_at");`);
    this.addSql(`create index "idx_archived_at" on "session_archives" ("archived_at");`);
    this.addSql(`create index "idx_retention_expires_at" on "session_archives" ("retention_expires_at");`);
    this.addSql(`create index "idx_archive_user" on "session_archives" ("user_id", "terminated_at");`);

    this.addSql(`alter table "session_archives" add constraint "session_archives_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);
    this.addSql(`alter table "session_archives" add constraint "session_archives_device_id_foreign" foreign key ("device_id") references "devices" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "session_archives" cascade;`);
  }

}
