import { Migration } from '@mikro-orm/migrations';

export class Migration20250729115333 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "sessions" add column "session_id" varchar(255) not null;`);
    this.addSql(`alter table "sessions" add constraint "sessions_session_id_unique" unique ("session_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "sessions" drop constraint "sessions_session_id_unique";`);
    this.addSql(`alter table "sessions" drop column "session_id";`);
  }

}
