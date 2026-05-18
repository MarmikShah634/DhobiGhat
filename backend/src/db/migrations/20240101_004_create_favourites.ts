import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('favourites', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('customer_id').references('id').inTable('customers').notNullable();
    table.uuid('washerman_id').references('id').inTable('washermen').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['customer_id', 'washerman_id']);
  });
  await knex.raw('CREATE INDEX idx_favourites_customer_id ON favourites(customer_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('favourites');
}
