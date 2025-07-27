import { Migration } from '@mikro-orm/migrations';

export class Migration20250726112317 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "sessions" alter column "expires_at" type timestamptz using ("expires_at"::timestamptz);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "sessions" alter column "expires_at" type date using ("expires_at"::date);`);
  }

}
