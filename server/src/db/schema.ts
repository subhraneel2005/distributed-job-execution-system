import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey(),
    task_name: text('task_name').notNull(),
    priority: text('priority', { enum: ['HIGH', 'MEDIUM', 'LOW'] }).notNull(),
    status: text('status', {
      enum: ['QUEUED', 'ASSIGNED', 'RUNNING', 'COMPLETED', 'FAILED', 'FAILED_QUEUE'],
    }).notNull(),
    retry_count: integer('retry_count').notNull().default(0),
    max_retries: integer('max_retries').notNull().default(3),
    payload: jsonb('payload').default('{}'),
    assigned_worker: uuid('assigned_worker'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_jobs_status').on(table.status),
    index('idx_jobs_priority_created').on(table.priority, table.created_at),
  ]
);

export const workers = pgTable(
  'workers',
  {
    id: uuid('id').primaryKey(),
    status: text('status', {
      enum: ['ONLINE', 'BUSY', 'OFFLINE', 'DEAD'],
    }).notNull(),
    last_heartbeat: timestamp('last_heartbeat', { withTimezone: true }),
    max_capacity: integer('max_capacity').notNull().default(5),
    current_jobs_processing: integer('current_jobs_processing').notNull().default(0),
    assigned_jobs: text('assigned_jobs').array().notNull().default(sql`'{}'::text[]`),
    metadata: jsonb('metadata'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_workers_status').on(table.status),
  ]
);

export const executionHistory = pgTable(
  'execution_history',
  {
    id: uuid('id').primaryKey(),
    job_id: uuid('job_id')
      .notNull()
      .references(() => jobs.id),
    worker_id: uuid('worker_id').references(() => workers.id),
    from_status: text('from_status'),
    to_status: text('to_status').notNull(),
    reason: text('reason'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_execution_history_job').on(table.job_id),
  ]
);
