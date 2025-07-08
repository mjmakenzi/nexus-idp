import { Migration } from '@mikro-orm/migrations';

export class Migration20250708054303_AddGoogleAndAppleIdFields extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "users" add column "google_id" varchar(255) null, add column "apple_id" varchar(255) null;`);
    this.addSql(`alter table "users" add constraint "users_google_id_unique" unique ("google_id");`);
    this.addSql(`alter table "users" add constraint "users_apple_id_unique" unique ("apple_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop constraint "users_google_id_unique";`);
    this.addSql(`alter table "users" drop constraint "users_apple_id_unique";`);
    this.addSql(`alter table "users" drop column "google_id", drop column "apple_id";`);
  }

}
