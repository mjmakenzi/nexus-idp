import { Migration } from '@mikro-orm/migrations';

export class Migration20250726131206 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "devices" drop column "device_name";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "devices" add column "device_name" varchar(255) null;`);
  }

}
