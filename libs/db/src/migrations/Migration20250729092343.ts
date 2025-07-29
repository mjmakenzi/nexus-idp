import { Migration } from '@mikro-orm/migrations';

export class Migration20250729092343 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "sessions" add column "max_expires_at" timestamptz not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "sessions" drop column "max_expires_at";`);
  }

}
