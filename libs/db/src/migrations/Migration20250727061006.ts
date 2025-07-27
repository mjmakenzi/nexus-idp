import { Migration } from '@mikro-orm/migrations';

export class Migration20250727061006 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "sessions" add column "termination_reason" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "sessions" drop column "termination_reason";`);
  }

}
