import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('price_grid', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('price_item_id').references('id').inTable('price_items').notNullable();
    table.uuid('wash_type_id').references('id').inTable('wash_types').notNullable();
    table.integer('price_paise').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['price_item_id', 'wash_type_id']);
  });
  await knex.raw(
    'CREATE INDEX idx_price_grid_item_wash ON price_grid(price_item_id, wash_type_id)',
  );
  await knex.raw(
    'ALTER TABLE price_grid ADD CONSTRAINT price_grid_price_positive CHECK (price_paise > 0)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('price_grid');
}
