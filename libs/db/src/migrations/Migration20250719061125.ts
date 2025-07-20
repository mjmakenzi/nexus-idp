import { Migration } from '@mikro-orm/migrations';

export class Migration20250719061125 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "roles" ("id" serial primary key, "name" varchar(255) not null, "code" varchar(255) not null, "description" varchar(255) null, "permissions" jsonb not null, "is_default" boolean not null default false, "is_system" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null);`,
    );
    this.addSql(
      `alter table "roles" add constraint "roles_code_unique" unique ("code");`,
    );

    this.addSql(
      `create table "users" ("id" serial primary key, "username" varchar(255) not null, "email" varchar(255) not null, "email_normalized" varchar(255) not null, "phone_number" varchar(255) null, "country_code" varchar(255) null, "password_hash" varchar(255) null, "password_salt" varchar(255) null, "password_changed_at" timestamptz null, "email_verified_at" timestamptz null, "phone_verified_at" timestamptz null, "failed_login_attempts" int not null default 0, "locked_until" timestamptz null, "last_login_at" timestamptz null, "last_login_ip" varchar(255) null, "status" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null);`,
    );
    this.addSql(
      `alter table "users" add constraint "users_username_unique" unique ("username");`,
    );
    this.addSql(
      `alter table "users" add constraint "users_email_unique" unique ("email");`,
    );
    this.addSql(
      `alter table "users" add constraint "users_email_normalized_unique" unique ("email_normalized");`,
    );

    this.addSql(
      `create table "security_events" ("id" serial primary key, "user_id" int null, "event_type" varchar(255) not null, "event_category" varchar(255) not null, "severity" varchar(255) not null, "risk_score" varchar(255) null, "event_data" jsonb null, "ip_address" varchar(255) null, "geo_location" jsonb null, "user_agent" varchar(255) null, "session_id" varchar(255) null, "occurred_at" timestamptz not null, "requires_action" boolean not null default false, "is_resolved" boolean not null default false, "resolved_by" varchar(255) null, "resolved_at" timestamptz null);`,
    );

    this.addSql(
      `create table "revoked_tokens" ("id" serial primary key, "user_id" int not null, "token_hash" varchar(255) not null, "token_type" varchar(255) not null, "user_agent" varchar(255) null, "ip_address" varchar(255) null, "expires_at" timestamptz not null, "revoked_at" timestamptz not null);`,
    );
    this.addSql(
      `alter table "revoked_tokens" add constraint "revoked_tokens_token_hash_unique" unique ("token_hash");`,
    );

    this.addSql(
      `create table "profiles" ("id" serial primary key, "user_id" int not null, "first_name" varchar(255) null, "last_name" varchar(255) null, "displayname" varchar(255) null default 'کاربر تازه‌وارد', "avatar_url" varchar(255) null, "bio" text null, "social_links" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`,
    );
    this.addSql(
      `alter table "profiles" add constraint "profiles_user_id_unique" unique ("user_id");`,
    );

    this.addSql(
      `create table "otps" ("id" serial primary key, "user_id" int null, "identifier" text check ("identifier" in ('email', 'phone')) not null, "otp_hash" varchar(255) not null, "purpose" text check ("purpose" in ('login', 'register', 'password_reset', 'email_verification', 'phone_verification')) not null, "delivery_method" text check ("delivery_method" in ('sms', 'email', 'voice', 'app')) not null, "step_number" int not null default 1, "user_agent" varchar(255) null, "ip_address" varchar(255) null, "created_at" timestamptz not null, "expires_at" timestamptz not null, "verified_at" timestamptz null);`,
    );

    this.addSql(
      `create table "federated_identities" ("id" serial primary key, "user_id" int not null, "provider" varchar(255) not null, "provider_user_id" varchar(255) not null, "provider_username" varchar(255) null, "provider_email" varchar(255) null, "provider_data" jsonb null, "access_token_hash" varchar(255) null, "refresh_token_hash" varchar(255) null, "token_expires_at" timestamptz null, "is_primary" boolean not null default false, "linked_at" timestamptz not null, "last_used_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`,
    );

    this.addSql(
      `create table "devices" ("id" serial primary key, "user_id" int not null, "device_fingerprint" varchar(255) not null, "device_name" varchar(255) null, "device_type" varchar(255) not null, "os_name" varchar(255) null, "os_version" varchar(255) null, "browser_name" varchar(255) null, "browser_version" varchar(255) null, "is_trusted" boolean not null default false, "last_seen_at" timestamptz not null, "user_agent" varchar(255) null, "last_ip_address" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`,
    );
    this.addSql(
      `alter table "devices" add constraint "devices_device_fingerprint_unique" unique ("device_fingerprint");`,
    );

    this.addSql(
      `create table "sessions" ("id" serial primary key, "user_id" int not null, "device_id" int null, "access_token_hash" text null, "refresh_token_hash" text null, "user_agent" varchar(255) null, "ip_address" varchar(255) null, "created_at" timestamptz not null, "last_activity_at" timestamptz not null, "expires_at" timestamptz not null, "terminated_at" timestamptz null);`,
    );

    this.addSql(
      `create table "audit_logs" ("id" serial primary key, "user_id" int not null, "target_user_id" int null, "actor_type" varchar(255) not null, "action" varchar(255) not null, "resource_type" varchar(255) not null, "resource_id" varchar(255) not null, "old_values" jsonb null, "new_values" jsonb null, "ip_address" varchar(255) null, "user_agent" varchar(255) null, "metadata" jsonb null, "performed_at" timestamptz not null, "created_on" timestamptz not null);`,
    );

    this.addSql(
      `create table "api_keys" ("id" serial primary key, "user_id" int not null, "name" varchar(255) not null, "key_id" varchar(255) not null, "key_hash" varchar(255) not null, "key_prefix" varchar(255) not null, "allowed_permissions" jsonb null, "allowed_ips" jsonb null, "rate_limits" jsonb null, "last_used_at" timestamptz null, "last_used_ip" varchar(255) null, "expires_at" timestamptz null, "is_active" boolean not null default true, "created_at" timestamptz not null, "created_by" varchar(255) null);`,
    );
    this.addSql(
      `alter table "api_keys" add constraint "api_keys_key_id_unique" unique ("key_id");`,
    );

    this.addSql(
      `create table "user_roles" ("id" serial primary key, "user_id" int not null, "role_id" int not null, "granted_at" timestamptz not null, "expires_at" timestamptz null, "granted_by" varchar(255) null, "grant_reason" varchar(255) null);`,
    );

    this.addSql(
      `alter table "security_events" add constraint "security_events_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "revoked_tokens" add constraint "revoked_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "profiles" add constraint "profiles_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "otps" add constraint "otps_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "federated_identities" add constraint "federated_identities_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "devices" add constraint "devices_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "sessions" add constraint "sessions_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "sessions" add constraint "sessions_device_id_foreign" foreign key ("device_id") references "devices" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "audit_logs" add constraint "audit_logs_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "audit_logs" add constraint "audit_logs_target_user_id_foreign" foreign key ("target_user_id") references "users" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "api_keys" add constraint "api_keys_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "user_roles" add constraint "user_roles_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "user_roles" add constraint "user_roles_role_id_foreign" foreign key ("role_id") references "roles" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "user_roles" drop constraint "user_roles_role_id_foreign";`,
    );

    this.addSql(
      `alter table "security_events" drop constraint "security_events_user_id_foreign";`,
    );

    this.addSql(
      `alter table "revoked_tokens" drop constraint "revoked_tokens_user_id_foreign";`,
    );

    this.addSql(
      `alter table "profiles" drop constraint "profiles_user_id_foreign";`,
    );

    this.addSql(`alter table "otps" drop constraint "otps_user_id_foreign";`);

    this.addSql(
      `alter table "federated_identities" drop constraint "federated_identities_user_id_foreign";`,
    );

    this.addSql(
      `alter table "devices" drop constraint "devices_user_id_foreign";`,
    );

    this.addSql(
      `alter table "sessions" drop constraint "sessions_user_id_foreign";`,
    );

    this.addSql(
      `alter table "audit_logs" drop constraint "audit_logs_user_id_foreign";`,
    );

    this.addSql(
      `alter table "audit_logs" drop constraint "audit_logs_target_user_id_foreign";`,
    );

    this.addSql(
      `alter table "api_keys" drop constraint "api_keys_user_id_foreign";`,
    );

    this.addSql(
      `alter table "user_roles" drop constraint "user_roles_user_id_foreign";`,
    );

    this.addSql(
      `alter table "sessions" drop constraint "sessions_device_id_foreign";`,
    );

    this.addSql(`drop table if exists "roles" cascade;`);

    this.addSql(`drop table if exists "users" cascade;`);

    this.addSql(`drop table if exists "security_events" cascade;`);

    this.addSql(`drop table if exists "revoked_tokens" cascade;`);

    this.addSql(`drop table if exists "profiles" cascade;`);

    this.addSql(`drop table if exists "otps" cascade;`);

    this.addSql(`drop table if exists "federated_identities" cascade;`);

    this.addSql(`drop table if exists "devices" cascade;`);

    this.addSql(`drop table if exists "sessions" cascade;`);

    this.addSql(`drop table if exists "audit_logs" cascade;`);

    this.addSql(`drop table if exists "api_keys" cascade;`);

    this.addSql(`drop table if exists "user_roles" cascade;`);
  }
}
