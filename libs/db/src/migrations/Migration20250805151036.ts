import { Migration } from '@mikro-orm/migrations';

export class Migration20250805151036 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "users" alter column "country_code" type char(5) using ("country_code"::char(5));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" alter column "country_code" type char(2) using ("country_code"::char(2));`);
  }

}
