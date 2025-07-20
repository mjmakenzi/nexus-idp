import { Migration } from '@mikro-orm/migrations';

export class Migration20250719125609 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "users" alter column "email" type varchar(255) using ("email"::varchar(255));`);
    this.addSql(`alter table "users" alter column "email" drop not null;`);
    this.addSql(`alter table "users" alter column "email_normalized" type varchar(255) using ("email_normalized"::varchar(255));`);
    this.addSql(`alter table "users" alter column "email_normalized" drop not null;`);
    this.addSql(`alter table "users" alter column "password_hash" type varchar(255) using ("password_hash"::varchar(255));`);
    this.addSql(`alter table "users" alter column "password_hash" set not null;`);
    this.addSql(`alter table "users" alter column "password_salt" type varchar(255) using ("password_salt"::varchar(255));`);
    this.addSql(`alter table "users" alter column "password_salt" set not null;`);
    this.addSql(`alter table "users" alter column "status" type text using ("status"::text);`);
    this.addSql(`alter table "users" alter column "status" set default 'active';`);
    this.addSql(`alter table "users" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
    this.addSql(`alter table "users" alter column "created_at" drop not null;`);
    this.addSql(`alter table "users" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "users" alter column "updated_at" drop not null;`);
    this.addSql(`alter table "users" add constraint "users_status_check" check("status" in ('active', 'inactive', 'pending'));`);

    this.addSql(`alter table "otps" drop column "verified_at";`);

    this.addSql(`alter table "otps" alter column "identifier" type varchar(255) using ("identifier"::varchar(255));`);
    this.addSql(`alter table "otps" alter column "identifier" set default 'phone';`);
    this.addSql(`alter table "otps" alter column "purpose" type text using ("purpose"::text);`);
    this.addSql(`alter table "otps" alter column "purpose" set default 'login';`);
    this.addSql(`alter table "otps" alter column "delivery_method" type varchar(255) using ("delivery_method"::varchar(255));`);
    this.addSql(`alter table "otps" alter column "delivery_method" set default 'sms';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop constraint if exists "users_status_check";`);

    this.addSql(`alter table "users" alter column "email" type varchar(255) using ("email"::varchar(255));`);
    this.addSql(`alter table "users" alter column "email" set not null;`);
    this.addSql(`alter table "users" alter column "email_normalized" type varchar(255) using ("email_normalized"::varchar(255));`);
    this.addSql(`alter table "users" alter column "email_normalized" set not null;`);
    this.addSql(`alter table "users" alter column "password_hash" type varchar(255) using ("password_hash"::varchar(255));`);
    this.addSql(`alter table "users" alter column "password_hash" drop not null;`);
    this.addSql(`alter table "users" alter column "password_salt" type varchar(255) using ("password_salt"::varchar(255));`);
    this.addSql(`alter table "users" alter column "password_salt" drop not null;`);
    this.addSql(`alter table "users" alter column "status" drop default;`);
    this.addSql(`alter table "users" alter column "status" type varchar(255) using ("status"::varchar(255));`);
    this.addSql(`alter table "users" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
    this.addSql(`alter table "users" alter column "created_at" set not null;`);
    this.addSql(`alter table "users" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "users" alter column "updated_at" set not null;`);

    this.addSql(`alter table "otps" add column "verified_at" timestamptz null;`);
    this.addSql(`alter table "otps" alter column "identifier" drop default;`);
    this.addSql(`alter table "otps" alter column "identifier" type OtpIdentifier using ("identifier"::OtpIdentifier);`);
    this.addSql(`alter table "otps" alter column "purpose" drop default;`);
    this.addSql(`alter table "otps" alter column "purpose" type text using ("purpose"::text);`);
    this.addSql(`alter table "otps" alter column "delivery_method" drop default;`);
    this.addSql(`alter table "otps" alter column "delivery_method" type OtpDeliveryMethod using ("delivery_method"::OtpDeliveryMethod);`);
  }

}
