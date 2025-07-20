import { Migration } from '@mikro-orm/migrations';

export class Migration20250720122721 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "profiles" rename column "displayname" to "display_name";`);

    this.addSql(`alter table "otps" add column "verified_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "profiles" rename column "display_name" to "displayname";`);

    this.addSql(`alter table "otps" drop column "verified_at";`);
  }

}
