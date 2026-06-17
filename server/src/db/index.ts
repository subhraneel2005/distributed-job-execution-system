import "dotenv/config"
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { logger } from '../utils/index.js';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME ?? 'job_execution',
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  ssl: false
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

const db = drizzle(pool, { schema });

export { db, pool };
export default db;
