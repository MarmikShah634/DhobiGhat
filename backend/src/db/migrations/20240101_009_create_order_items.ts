import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('order_id').references('id').inTable('orders').notNullable();
    table.uuid('price_grid_id').references('id').inTable('price_grid').notNullable();
    table.string('item_name_snapshot', 100).notNullable();
    table.string('wash_type_snapshot', 100).notNullable();
    table.integer('unit_price_paise').notNullable();
    table.smallint('quantity').notNullable().checkPositive();
    table.integer('subtotal_paise').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('order_items');
}
