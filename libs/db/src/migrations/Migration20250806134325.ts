import { Migration } from '@mikro-orm/migrations';

export class Migration20250806134325 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "sessions" alter column "termination_reason" type varchar(50) using ("termination_reason"::varchar(50));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "sessions" alter column "termination_reason" type varchar(20) using ("termination_reason"::varchar(20));`);
  }

}
