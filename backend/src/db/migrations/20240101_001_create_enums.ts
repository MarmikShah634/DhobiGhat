import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE order_status AS ENUM (
        'pending', 'accepted', 'declined', 'cancelled',
        'collecting', 'collected', 'in_progress', 'ready', 'delivered'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE delivery_mode AS ENUM ('door_to_door', 'drop_off');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TYPE IF EXISTS order_status;
    DROP TYPE IF EXISTS delivery_mode;
  `);
}
