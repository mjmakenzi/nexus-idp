import { Migration } from '@mikro-orm/migrations';

export class Migration20250701104519 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "users" add column "username" varchar(255) not null;`);
    this.addSql(`alter table "users" add constraint "users_username_unique" unique ("username");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop constraint "users_username_unique";`);
    this.addSql(`alter table "users" drop column "username";`);
  }

}
