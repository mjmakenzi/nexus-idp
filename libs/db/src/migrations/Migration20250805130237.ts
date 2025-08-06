import { Migration } from '@mikro-orm/migrations';

export class Migration20250805130237 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "rate_limits" ("id" bigserial primary key, "identifier" varchar(255) not null, "limit_type" varchar(50) not null, "scope" varchar(20) not null, "attempts" int not null default 0, "max_attempts" int not null, "window_seconds" int not null, "window_start" timestamptz not null, "window_end" timestamptz not null, "blocked_until" timestamptz null, "ip_address" varchar(45) null, "metadata" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`create index "idx_window_end" on "rate_limits" ("window_end");`);
    this.addSql(`create index "idx_blocked_until" on "rate_limits" ("blocked_until");`);
    this.addSql(`alter table "rate_limits" add constraint "unique_limit" unique ("identifier", "limit_type", "scope");`);

    this.addSql(`create table "roles" ("id" bigserial primary key, "name" varchar(100) not null, "code" varchar(50) not null, "description" text null, "permissions" jsonb not null, "is_default" boolean not null default false, "is_system" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`create index "idx_code" on "roles" ("code");`);
    this.addSql(`alter table "roles" add constraint "roles_code_unique" unique ("code");`);
    this.addSql(`create index "idx_is_default" on "roles" ("is_default");`);

    this.addSql(`create table "users" ("id" bigserial primary key, "username" varchar(50) not null, "email_normalized" varchar(255) null, "email" varchar(255) null, "phone" varchar(20) null, "phone_number" varchar(20) null, "country_code" char(2) null, "external_id" varchar(100) null, "password_hash" varchar(255) not null, "password_salt" varchar(255) not null, "password_changed_at" timestamptz null, "password_version" int not null default 1, "totp_secret" varchar(100) null, "backup_codes" jsonb null, "mfa_enabled" boolean not null default false, "mfa_method" varchar(20) null, "email_verified_at" timestamptz null, "phone_verified_at" timestamptz null, "identity_verified_at" timestamptz null, "failed_login_attempts" int not null default 0, "locked_until" timestamptz null, "last_login_at" timestamptz null, "last_login_ip" varchar(45) null, "status" varchar(20) not null default 'pending', "terms_accepted_at" timestamptz null, "terms_version" varchar(20) null, "privacy_accepted_at" timestamptz null, "privacy_version" varchar(20) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "created_by" varchar(100) null, "updated_by" varchar(100) null);`);
    this.addSql(`alter table "users" add constraint "users_username_unique" unique ("username");`);
    this.addSql(`create index "idx_email_normalized" on "users" ("email_normalized");`);
    this.addSql(`alter table "users" add constraint "users_email_normalized_unique" unique ("email_normalized");`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);
    this.addSql(`create index "idx_phone" on "users" ("phone");`);
    this.addSql(`create index "idx_last_login" on "users" ("last_login_at");`);
    this.addSql(`create index "idx_last_login_ip" on "users" ("last_login_ip");`);
    this.addSql(`create index "idx_status" on "users" ("status");`);
    this.addSql(`create index "idx_deleted_at" on "users" ("deleted_at");`);

    this.addSql(`create table "security_events" ("id" bigserial primary key, "user_id" bigint null, "event_type" varchar(50) not null, "event_category" varchar(20) not null, "severity" varchar(20) not null, "risk_score" smallint null, "event_data" jsonb null, "ip_address" varchar(45) null, "geo_location" jsonb null, "user_agent" text null, "session_id" varchar(36) null, "occurred_at" timestamptz not null, "requires_action" boolean not null default false, "is_resolved" boolean not null default false, "resolved_by" varchar(100) null, "resolved_at" timestamptz null);`);
    this.addSql(`create index "idx_risk_score" on "security_events" ("risk_score");`);
    this.addSql(`create index "idx_user_occurred" on "security_events" ("user_id", "occurred_at");`);
    this.addSql(`create index "idx_severity_unresolved" on "security_events" ("severity", "is_resolved");`);

    this.addSql(`create table "revoked_tokens" ("id" bigserial primary key, "user_id" bigint null, "token_hash" varchar(255) not null, "token_type" varchar(20) not null, "jti" varchar(100) null, "user_agent" varchar(255) null, "ip_address" varchar(45) null, "issued_at" timestamptz not null, "expires_at" timestamptz not null, "revoked_at" timestamptz not null, "revocation_reason" varchar(20) null, "revoked_by" varchar(100) null);`);
    this.addSql(`create index "idx_token_hash" on "revoked_tokens" ("token_hash");`);
    this.addSql(`alter table "revoked_tokens" add constraint "revoked_tokens_token_hash_unique" unique ("token_hash");`);
    this.addSql(`create index "idx_revoked_token_expires_at" on "revoked_tokens" ("expires_at");`);

    this.addSql(`create table "profiles" ("id" bigserial primary key, "user_id" bigint not null, "user_data_key" varchar(100) not null, "first_name" varchar(100) null, "last_name" varchar(100) null, "display_name" varchar(200) null, "bio" text null, "date_of_birth" date null, "gender" varchar(50) null, "avatar_file_name" varchar(500) null, "cover_file_name" varchar(500) null, "website" varchar(500) null, "social_links" jsonb null, "apple_uid" varchar(100) null, "google_id" varchar(100) null, "timezone" varchar(50) null default 'utc', "locale" varchar(10) null default 'en-US', "preferred_language" varchar(10) null, "preferences" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`alter table "profiles" add constraint "profiles_user_id_unique" unique ("user_id");`);
    this.addSql(`create index "idx_user_data_key" on "profiles" ("user_data_key");`);
    this.addSql(`alter table "profiles" add constraint "profiles_user_data_key_unique" unique ("user_data_key");`);
    this.addSql(`create index "idx_display_name" on "profiles" ("display_name");`);

    this.addSql(`create table "otps" ("id" bigserial primary key, "user_id" bigint null, "identifier" varchar(20) not null, "otp_hash" varchar(255) not null, "purpose" varchar(20) not null, "delivery_method" varchar(20) not null, "step_number" int not null default 1, "attempts" int not null default 0, "max_attempts" int not null default 5, "metadata" jsonb null, "user_agent" text null, "ip_address" varchar(45) null, "created_at" timestamptz not null, "expires_at" timestamptz not null, "verified_at" timestamptz null, "is_used" boolean not null default false);`);
    this.addSql(`create index "idx_otp_expires_at" on "otps" ("expires_at");`);
    this.addSql(`create index "idx_user_purpose" on "otps" ("user_id", "purpose");`);
    this.addSql(`create index "idx_identifier_purpose" on "otps" ("identifier", "purpose", "is_used");`);

    this.addSql(`create table "federated_identities" ("id" bigserial primary key, "user_id" bigint not null, "provider" varchar(20) not null, "provider_user_id" varchar(255) not null, "provider_username" varchar(255) null, "provider_email" varchar(255) null, "provider_data" jsonb null, "access_token_hash" varchar(255) null, "refresh_token_hash" varchar(255) null, "token_expires_at" timestamptz null, "is_primary" boolean not null default false, "linked_at" timestamptz not null, "last_used_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`alter table "federated_identities" add constraint "federated_identities_provider_user_id_unique" unique ("provider_user_id");`);
    this.addSql(`create index "idx_user_provider" on "federated_identities" ("user_id", "provider");`);
    this.addSql(`alter table "federated_identities" add constraint "unique_provider_user" unique ("provider", "provider_user_id");`);

    this.addSql(`create table "devices" ("id" bigserial primary key, "user_id" bigint not null, "device_fingerprint" varchar(255) not null, "device_name" varchar(200) null, "device_type" varchar(20) not null, "os_name" varchar(50) null, "os_version" varchar(20) null, "browser_name" varchar(50) null, "browser_version" varchar(20) null, "device_metadata" jsonb null, "is_trusted" boolean not null default false, "is_managed" boolean not null default false, "first_seen_at" timestamptz not null, "last_seen_at" timestamptz not null, "trusted_at" timestamptz null, "blocked_at" timestamptz null, "block_reason" varchar(500) null, "user_agent" text null, "last_ip_address" varchar(45) null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`create index "idx_device_fingerprint" on "devices" ("device_fingerprint");`);
    this.addSql(`alter table "devices" add constraint "devices_device_fingerprint_unique" unique ("device_fingerprint");`);
    this.addSql(`create index "idx_last_seen_at" on "devices" ("last_seen_at");`);
    this.addSql(`create index "idx_user_trusted" on "devices" ("user_id", "is_trusted");`);

    this.addSql(`create table "sessions" ("id" bigserial primary key, "user_id" bigint not null, "device_id" bigint null, "session_id" varchar(36) not null, "access_token_hash" varchar(255) null, "refresh_token_hash" varchar(255) null, "granted_permissions" jsonb null, "user_agent" text null, "ip_address" varchar(45) null, "geo_location" jsonb null, "created_at" timestamptz not null, "last_activity_at" timestamptz not null, "expires_at" timestamptz not null, "max_expires_at" timestamptz not null, "terminated_at" timestamptz null, "termination_reason" varchar(20) null, "is_remembered" boolean not null default false);`);
    this.addSql(`create index "idx_session_id" on "sessions" ("session_id");`);
    this.addSql(`alter table "sessions" add constraint "sessions_session_id_unique" unique ("session_id");`);
    this.addSql(`create index "idx_last_activity" on "sessions" ("last_activity_at");`);
    this.addSql(`create index "idx_session_expires_at" on "sessions" ("expires_at");`);
    this.addSql(`create index "idx_user_active" on "sessions" ("user_id", "terminated_at");`);

    this.addSql(`create table "audit_logs" ("id" bigserial primary key, "user_id" bigint null, "target_user_id" bigint null, "actor_type" varchar(20) not null, "action" varchar(20) not null, "resource_type" varchar(50) not null, "resource_id" varchar(100) not null, "old_values" jsonb null, "new_values" jsonb null, "ip_address" varchar(45) null, "user_agent" text null, "metadata" jsonb null, "performed_at" timestamptz not null);`);
    this.addSql(`create index "idx_performed_at" on "audit_logs" ("performed_at");`);
    this.addSql(`create index "idx_user_performed" on "audit_logs" ("user_id", "performed_at");`);
    this.addSql(`create index "idx_resource" on "audit_logs" ("resource_type", "resource_id");`);

    this.addSql(`create table "api_keys" ("id" bigserial primary key, "user_id" bigint not null, "name" varchar(200) not null, "key_id" varchar(50) not null, "key_hash" varchar(255) not null, "key_prefix" varchar(20) not null, "allowed_permissions" jsonb null, "allowed_ips" jsonb null, "rate_limits" jsonb null, "last_used_at" timestamptz null, "last_used_ip" varchar(45) null, "expires_at" timestamptz null, "is_active" boolean not null default true, "created_at" timestamptz not null, "created_by" varchar(100) null);`);
    this.addSql(`create index "idx_key_id" on "api_keys" ("key_id");`);
    this.addSql(`alter table "api_keys" add constraint "api_keys_key_id_unique" unique ("key_id");`);
    this.addSql(`create index "idx_api_key_user_active" on "api_keys" ("user_id", "is_active");`);

    this.addSql(`create table "user_roles" ("id" bigserial primary key, "user_id" bigint not null, "role_id" bigint not null, "granted_at" timestamptz not null, "expires_at" timestamptz null, "granted_by" varchar(100) null, "grant_reason" text null);`);
    this.addSql(`create index "idx_user_role_expires_at" on "user_roles" ("expires_at");`);
    this.addSql(`alter table "user_roles" add constraint "unique_user_role" unique ("user_id", "role_id");`);

    this.addSql(`alter table "security_events" add constraint "security_events_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "revoked_tokens" add constraint "revoked_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "profiles" add constraint "profiles_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "otps" add constraint "otps_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "federated_identities" add constraint "federated_identities_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "devices" add constraint "devices_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "sessions" add constraint "sessions_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);
    this.addSql(`alter table "sessions" add constraint "sessions_device_id_foreign" foreign key ("device_id") references "devices" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "audit_logs" add constraint "audit_logs_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "audit_logs" add constraint "audit_logs_target_user_id_foreign" foreign key ("target_user_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "api_keys" add constraint "api_keys_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "user_roles" add constraint "user_roles_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);
    this.addSql(`alter table "user_roles" add constraint "user_roles_role_id_foreign" foreign key ("role_id") references "roles" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user_roles" drop constraint "user_roles_role_id_foreign";`);

    this.addSql(`alter table "security_events" drop constraint "security_events_user_id_foreign";`);

    this.addSql(`alter table "revoked_tokens" drop constraint "revoked_tokens_user_id_foreign";`);

    this.addSql(`alter table "profiles" drop constraint "profiles_user_id_foreign";`);

    this.addSql(`alter table "otps" drop constraint "otps_user_id_foreign";`);

    this.addSql(`alter table "federated_identities" drop constraint "federated_identities_user_id_foreign";`);

    this.addSql(`alter table "devices" drop constraint "devices_user_id_foreign";`);

    this.addSql(`alter table "sessions" drop constraint "sessions_user_id_foreign";`);

    this.addSql(`alter table "audit_logs" drop constraint "audit_logs_user_id_foreign";`);

    this.addSql(`alter table "audit_logs" drop constraint "audit_logs_target_user_id_foreign";`);

    this.addSql(`alter table "api_keys" drop constraint "api_keys_user_id_foreign";`);

    this.addSql(`alter table "user_roles" drop constraint "user_roles_user_id_foreign";`);

    this.addSql(`alter table "sessions" drop constraint "sessions_device_id_foreign";`);

    this.addSql(`drop table if exists "rate_limits" cascade;`);

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
