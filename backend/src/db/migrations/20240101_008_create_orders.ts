import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('order_number', 20).unique().notNullable();
    table.uuid('customer_id').references('id').inTable('customers').notNullable();
    table.uuid('washerman_id').references('id').inTable('washermen').notNullable();
    table.specificType('status', 'order_status').notNullable().defaultTo('pending');
    table.specificType('delivery_mode', 'delivery_mode').notNullable();
    table.date('pickup_date').notNullable();
    table.text('notes');
    table.integer('total_paise').notNullable().defaultTo(0);
    table.boolean('is_paid').defaultTo(false);
    table.timestamp('paid_at');
    table.text('decline_reason');
    table.boolean('washerman_collected_confirmed').defaultTo(false);
    table.boolean('customer_collected_confirmed').defaultTo(false);
    table.timestamp('washerman_collected_at');
    table.timestamp('customer_collected_at');
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_orders_washerman_status ON orders(washerman_id, status)');
  await knex.raw('CREATE INDEX idx_orders_customer_created ON orders(customer_id, created_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('orders');
}
