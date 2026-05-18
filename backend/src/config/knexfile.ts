import type { Knex } from 'knex';
import { env } from './env';

const config: Knex.Config = {
  client: 'pg',
  connection: env.databaseUrl || {
    host: 'localhost',
    database: 'dhobighat',
    user: 'postgres',
    password: 'postgres',
  },
  pool: { min: 2, max: 10 },
  migrations: {
    tableName: 'knex_migrations',
    directory: '../db/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: '../db/seeds',
    extension: 'ts',
  },
};

export default config;
