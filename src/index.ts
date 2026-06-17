import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { startScheduler } from './scheduler/index.js';
import { startHeartbeatMonitor } from './heartbeat/index.js';
import { spawnWorker } from './workers/index.js';
import { logger } from './utils/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function main(): Promise<void> {
  logger.info('Starting distributed job execution platform...');

  await db.execute(sql`UPDATE workers SET status = 'OFFLINE' WHERE status IN ('ONLINE', 'BUSY')`);

  startScheduler(3000);
  startHeartbeatMonitor(3000);

  // spawn more when need more workers
  await spawnWorker(3);
  await spawnWorker(3);

  await db.execute(sql`SELECT 1`)
  logger.info("Database is UP")

  const { default: app } = await import('./api/app.js');

  const PORT = parseInt(process.env.PORT ?? '3000', 10);
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'API server listening');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start application');
  process.exit(1);
});
