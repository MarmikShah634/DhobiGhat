import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('order_id').references('id').inTable('orders').unique().notNullable();
    table.uuid('customer_id').references('id').inTable('customers').notNullable();
    table.uuid('washerman_id').references('id').inTable('washermen').notNullable();
    table.smallint('rating').notNullable();
    table.string('review_text', 300);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5)
  `);
  await knex.raw('CREATE INDEX idx_reviews_washerman_id ON reviews(washerman_id)');

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_washerman_rating()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE washermen
      SET
        avg_rating = (SELECT COALESCE(AVG(rating::numeric), 0) FROM reviews WHERE washerman_id = NEW.washerman_id),
        review_count = (SELECT COUNT(*) FROM reviews WHERE washerman_id = NEW.washerman_id)
      WHERE id = NEW.washerman_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER after_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_washerman_rating();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS after_review_insert ON reviews');
  await knex.raw('DROP FUNCTION IF EXISTS update_washerman_rating()');
  await knex.schema.dropTableIfExists('reviews');
}
