# Distributed Job Execution Platform
https://github.com/user-attachments/assets/3ded9270-556b-44ae-9e6c-6bb9a001fcf6

A fault-tolerant distributed job execution system with PostgreSQL persistence, priority-based scheduling, heartbeat health monitoring, retry handling, and a dead letter queue.

## Prerequisites

- **Node.js** >= 20
- **PostgreSQL** >= 14
- **npm** >= 9

## Environment Configuration

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=job_execution
DB_USER=postgres
DB_PASSWORD=postgres
PORT=8000
LOG_LEVEL=info
```

All variables have sensible defaults — you only need to override what differs.

## Installation

```bash
npm install
```

## Database Setup

The project uses **Drizzle ORM** with PostgreSQL. Run migrations to create the schema:

```bash
npm run db:migrate
```

If you're actively developing and changing schemas, generate new migrations after editing `src/db/schema.ts`:

```bash
npm run db:generate
npm run db:migrate
```

For rapid prototyping (no migration files):

```bash
npm run db:push
```

## Running the Application

```bash
npm run dev
```

This starts the server with `tsx watch` for hot-reload. On startup it:

1. Applies any pending database migrations
2. Marks stale workers from previous runs as `OFFLINE`
3. Spawns 3 simulated workers (capacities: 3, 3, 2)
4. Starts the scheduler and heartbeat monitor (both 3s intervals)
5. Listens on the configured port (default 8000)

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Jobs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/jobs` | Submit a new job |
| GET | `/api/jobs` | List all jobs (optional `?status=` filter) |
| GET | `/api/jobs/:id` | Get job by ID |
| GET | `/api/jobs/history/:id` | Get execution history for a job |

### Workers

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/workers/register` | Register a new worker |
| POST | `/api/workers/:id/heartbeat` | Send heartbeat |
| GET | `/api/workers` | List all workers |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

A Postman collection is available at `postman_collection.json`.

## Frontend (Next.js)

The `client/` directory contains a Next.js dashboard that consumes the REST API.

### Setup

```bash
cd client
npm install
```

### Environment

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run

```bash
npm run dev    # starts on port 3000
```

### Pages

| Path | Description |
|------|-------------|
| `/` | Dashboard — job/worker status counts, server health, recent jobs |
| `/jobs` | Job list with status filter and create-job dialog |
| `/jobs/[id]` | Job detail with full execution history |
| `/workers` | Worker list with heartbeat controls and register-worker dialog |

## Architecture Overview

```
Clients → Express API → Service Layer → PostgreSQL
                            ↗
              Scheduler (3s) ── assigns QUEUED jobs to available workers
              Heartbeat Monitor (3s) ── detects dead workers, requeues jobs
              Workers (simulated) ── pick up ASSIGNED jobs, execute, report back
              Retry Handler ── failed jobs either retry or go to DLQ
```

Jobs flow: `QUEUED → ASSIGNED → RUNNING → COMPLETED`

On failure: `RUNNING → FAILED → (retry → QUEUED) OR (max retries → FAILED_QUEUE)`

## Assumptions Made

1. **At-least-once execution**: Workers check job state before executing to handle duplicate assignments. Some duplicate execution is possible under network partitions — handlers should be idempotent.
2. **Single-server scheduler**: The scheduler runs in-process with no distributed locking. For production, a distributed scheduler (e.g., via pg_advisory_lock) would be needed.
3. **Heartbeat timeout is fixed at 10s**: Workers send heartbeats every 5s; if none received for 10s the worker is declared DEAD. This is not configurable at runtime.
4. **Simulated workers have 80% success rate**: Random failure injection to exercise the retry/DLQ paths.
5. **Database is the single source of truth**: No in-memory cache; all state reads go through PostgreSQL.
6. **Job payloads store execution metadata, not large artifacts**: Large files/blobs should be stored externally with references in the payload.
7. **No authentication**: All endpoints are unauthenticated by design for this assessment.
