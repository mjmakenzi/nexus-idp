import { Migration } from '@mikro-orm/migrations';

export class Migration20250727133431 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "devices" add column "blocked_at" timestamptz null, add column "block_reason" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "devices" drop column "blocked_at", drop column "block_reason";`);
  }

}
