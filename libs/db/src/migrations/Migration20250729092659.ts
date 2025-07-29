import { Migration } from '@mikro-orm/migrations';

export class Migration20250729092659 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "sessions" drop column "access_token_hash";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "sessions" add column "access_token_hash" text null;`);
  }

}
