import { v4 as uuidv4 } from 'uuid';
import { eq, asc, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { workers } from '../db/schema.js';
import type { Worker, WorkerStatus } from '../types/index.js';

export async function registerWorker(
  maxCapacity: number,
  metadata: Record<string, unknown>,
): Promise<Worker> {
  const [row] = await db
    .insert(workers)
    .values({
      id: uuidv4(),
      status: 'ONLINE',
      last_heartbeat: new Date(),
      max_capacity: maxCapacity,
      current_jobs_processing: 0,
      assigned_jobs: [],
      metadata,
    })
    .returning();
  return row!;
}

export async function getWorkerById(workerId: string): Promise<Worker | null> {
  const [row] = await db
    .select()
    .from(workers)
    .where(eq(workers.id, workerId));
  return row ?? null;
}

export async function getWorkers(status?: WorkerStatus): Promise<Worker[]> {
  if (status) {
    return db
      .select()
      .from(workers)
      .where(eq(workers.status, status))
      .orderBy(desc(workers.created_at));
  }
  return db
    .select()
    .from(workers)
    .orderBy(desc(workers.created_at));
}

export async function updateHeartbeat(workerId: string): Promise<Worker | null> {
  const [row] = await db
    .update(workers)
    .set({
      last_heartbeat: new Date(),
      status: 'ONLINE',
      updated_at: new Date(),
    })
    .where(eq(workers.id, workerId))
    .returning();
  return row ?? null;
}

export async function updateWorkerStatus(
  workerId: string,
  status: WorkerStatus,
): Promise<Worker | null> {
  const [row] = await db
    .update(workers)
    .set({ status, updated_at: new Date() })
    .where(eq(workers.id, workerId))
    .returning();
  return row ?? null;
}

export async function getAvailableWorkers(): Promise<Worker[]> {
  return db
    .select()
    .from(workers)
    .where(
      sql`${workers.status} IN ('ONLINE', 'BUSY') AND ${workers.current_jobs_processing} < ${workers.max_capacity}`,
    )
    .orderBy(asc(workers.current_jobs_processing));
}

export async function assignJobToWorker(jobId: string, workerId: string): Promise<void> {
  await db
    .update(workers)
    .set({
      current_jobs_processing: sql`current_jobs_processing + 1`,
      assigned_jobs: sql`array_append(assigned_jobs, ${jobId})`,
      updated_at: new Date(),
    })
    .where(eq(workers.id, workerId));
}

export async function releaseJobFromWorker(jobId: string, workerId: string): Promise<void> {
  await db
    .update(workers)
    .set({
      current_jobs_processing: sql`current_jobs_processing - 1`,
      assigned_jobs: sql`array_remove(assigned_jobs, ${jobId})`,
      updated_at: new Date(),
    })
    .where(eq(workers.id, workerId));
}

export async function releaseAllWorkerJobs(workerId: string): Promise<void> {
  await db
    .update(workers)
    .set({
      current_jobs_processing: 0,
      assigned_jobs: [],
      updated_at: new Date(),
    })
    .where(eq(workers.id, workerId));
}
