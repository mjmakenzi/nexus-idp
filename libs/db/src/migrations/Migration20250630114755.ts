import { Migration } from '@mikro-orm/migrations';

export class Migration20250630114755 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "users" ("id" serial primary key, "email" varchar(255) null, "phone_no" varchar(255) null, "password_hash" varchar(255) null, "password_salt" varchar(255) null, "country_code" varchar(255) null, "email_verified" boolean not null default false, "email_verified_on" timestamptz null, "phone_verified" boolean not null default false, "phone_verified_on" timestamptz null, "identity_verified" boolean not null default false, "identity_verified_on" timestamptz null, "failed_login_attempts" int not null default 0, "locked_until" timestamptz null, "registered_on" timestamptz not null, "modified_on" timestamptz not null, "is_deleted" boolean not null default false);`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);
    this.addSql(`alter table "users" add constraint "users_phone_no_unique" unique ("phone_no");`);

    this.addSql(`create table "sessions" ("id" serial primary key, "identifier_id" varchar(255) not null, "user_id" int not null, "access_token" text not null, "refresh_token" text not null, "user_agent" text null, "ip" varchar(255) null, "scope" varchar(255) null, "created_on" timestamptz not null, "modified_on" timestamptz not null, "expired_on" timestamptz not null);`);

    this.addSql(`create table "revoked_tokens" ("id" serial primary key, "user_id" int not null, "token" text not null, "type" int not null, "user_agent" text null, "ip" varchar(255) null, "expired_on" timestamptz not null, "revoked_on" timestamptz not null);`);

    this.addSql(`create table "profiles" ("id" serial primary key, "user_id" int not null, "first_name" varchar(255) null, "last_name" varchar(255) null, "display_name" varchar(255) null default 'کاربر تازه‌وارد', "avatar" jsonb null, "urls" jsonb null, "bio" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`alter table "profiles" add constraint "profiles_user_id_unique" unique ("user_id");`);

    this.addSql(`create table "otps" ("id" serial primary key, "user_id" int null, "country_code" varchar(255) null, "phone_no" varchar(255) null, "email" varchar(255) null, "otp" varchar(255) not null, "action_type" varchar(255) not null, "step_no" int not null, "user_agent" varchar(255) null, "ip" varchar(255) null, "created_on" timestamptz not null, "expired_on" timestamptz not null);`);

    this.addSql(`create table "devices" ("id" serial primary key, "user_id" int not null, "device_id" varchar(255) not null, "device_name" text null, "device_type" text null, "device_info" text null, "refresh_token" text null, "user_agent" text null, "ip" varchar(255) null, "is_trusted" boolean null, "last_activity" timestamptz null, "created_on" timestamptz not null, "expired_on" timestamptz null, "terminated_on" timestamptz null);`);

    this.addSql(`create table "audit_logs" ("id" serial primary key, "user_id" int not null, "action" varchar(255) not null, "metadata" jsonb not null, "ip" varchar(255) not null, "user_agent" varchar(255) not null, "created_on" timestamptz not null);`);

    this.addSql(`alter table "sessions" add constraint "sessions_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "revoked_tokens" add constraint "revoked_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "profiles" add constraint "profiles_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "otps" add constraint "otps_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "devices" add constraint "devices_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "audit_logs" add constraint "audit_logs_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "sessions" drop constraint "sessions_user_id_foreign";`);

    this.addSql(`alter table "revoked_tokens" drop constraint "revoked_tokens_user_id_foreign";`);

    this.addSql(`alter table "profiles" drop constraint "profiles_user_id_foreign";`);

    this.addSql(`alter table "otps" drop constraint "otps_user_id_foreign";`);

    this.addSql(`alter table "devices" drop constraint "devices_user_id_foreign";`);

    this.addSql(`alter table "audit_logs" drop constraint "audit_logs_user_id_foreign";`);

    this.addSql(`drop table if exists "users" cascade;`);

    this.addSql(`drop table if exists "sessions" cascade;`);

    this.addSql(`drop table if exists "revoked_tokens" cascade;`);

    this.addSql(`drop table if exists "profiles" cascade;`);

    this.addSql(`drop table if exists "otps" cascade;`);

    this.addSql(`drop table if exists "devices" cascade;`);

    this.addSql(`drop table if exists "audit_logs" cascade;`);
  }

}
