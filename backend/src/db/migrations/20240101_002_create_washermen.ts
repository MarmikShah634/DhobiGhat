import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('washermen', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('phone', 15).unique().notNullable();
    table.string('name', 100).notNullable();
    table.string('business_name', 150).notNullable();
    table.string('area', 150).notNullable();
    table.text('address');
    table.text('profile_photo_url');
    table.string('unique_code', 8).unique().notNullable();
    table.boolean('is_available').defaultTo(true);
    table.decimal('avg_rating', 3, 2).defaultTo(0);
    table.integer('review_count').defaultTo(0);
    table.text('fcm_token');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.timestamp('deleted_at');
  });

  await knex.raw('CREATE INDEX idx_washermen_area ON washermen(area)');
  await knex.raw('CREATE INDEX idx_washermen_is_available ON washermen(is_available)');
  await knex.raw('CREATE INDEX idx_washermen_avg_rating ON washermen(avg_rating)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('washermen');
}
