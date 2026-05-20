import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('recipient_type', 20).notNullable();
    table.uuid('recipient_id').notNullable();
    table.uuid('order_id').references('id').inTable('orders').nullable();
    table.text('title').notNullable();
    table.text('body').notNullable();
    table.boolean('is_read').defaultTo(false);
    table.timestamp('sent_at').defaultTo(knex.fn.now());
  });

  await knex.raw(
    'CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
}
