# Architecture.md

# Distributed Job Execution Platform

## Overview

This project implements a distributed job execution platform that allows users to submit computational jobs which are executed asynchronously across multiple workers.

The primary design goals are:

* Asynchronous job execution
* Horizontal worker scalability
* Fault tolerance
* Worker crash recovery
* Retry handling
* Execution history
* At-least-once execution guarantees
* Simple and maintainable architecture

The design intentionally favors practical engineering tradeoffs over unnecessary complexity.

---

# System Components

## User

Users can:

* Submit computational jobs
* Track job status
* View execution history

Jobs are submitted through:

```
POST /api/jobs
```

The server generates a unique Job ID and places the job into the scheduling queue.

---

## Job Queue

The queue acts as a buffer between incoming jobs and available workers.

Each job contains:

```
jobId
taskName
priority
status
retryCount
maxRetries
payload
createdAt
```

Scheduling policy:

* Higher priority jobs first
* FIFO ordering within the same priority level

Priority levels:

```
HIGH
MEDIUM
LOW
```

---

## Scheduler

The scheduler is responsible for assigning jobs to workers.

Responsibilities:

* Find queued jobs
* Find available workers
* Respect worker capacity
* Assign jobs
* Update job and worker state

A worker can process multiple jobs concurrently up to its configured capacity.

Before assigning a job, the scheduler verifies:

* Worker is online
* Worker has available capacity
* Job is not already assigned
* Job is still queued

---

## Workers

Workers register themselves with the system.

Registration:

```
POST /api/workers/register
```

Worker metadata:

```
workerId
status
lastHeartbeat
maxCapacity
currentJobsProcessing
assignedJobs
metadata
```

Worker states:

```
ONLINE
BUSY
OFFLINE
DEAD
```

Workers execute jobs asynchronously and report progress back to the server.

---

# Heartbeat Monitoring

Workers periodically send heartbeat messages.

```
POST /api/workers/{workerId}/heartbeat
```

Example interval:

* Heartbeat every 5 seconds

If no heartbeat is received for 10 seconds, the worker is considered dead.

The server updates:

```
lastHeartbeat
workerStatus
```

This allows detection of worker failures.

---

# Job Lifecycle

A job transitions through the following states:

```
QUEUED

↓

ASSIGNED

↓

RUNNING

↓

COMPLETED
```

Failure path:

```
RUNNING

↓

FAILED

↓

QUEUED
```

If retries exceed the configured maximum:

```
FAILED

↓

FAILED_QUEUE
```

---

# Retry Policy

Each job tracks:

```
retryCount
maxRetries
```

When a job fails:

```
retryCount++
```

If:

```
retryCount <= maxRetries
```

the job returns to the main queue.

Otherwise it moves to the failed queue.

This prevents infinite retry loops.

---

# Worker Crash Recovery

Worker failures are detected through missing heartbeats.

When a worker is declared dead:

1. Identify assigned jobs.
2. Check job status.
3. Requeue incomplete jobs.
4. Release worker resources.

Jobs in these states:

```
ASSIGNED
RUNNING
```

are eligible for recovery.

Completed jobs remain completed.

---

# Idempotent Job Handlers

Distributed systems may occasionally execute the same job more than once.

Possible scenarios:

* Worker crash
* Lost completion message
* Network partition
* Duplicate assignment during recovery

The platform provides at-least-once execution semantics.

To safely handle duplicate execution, workers implement idempotent job handlers.

Before executing a job:

1. Check persistent job state.
2. If already completed:

   * Ignore duplicate execution.
3. Otherwise:

   * Execute normally.
   * Persist result.
   * Mark job completed.

This ensures duplicate processing does not corrupt system state.

The design intentionally avoids the complexity of exactly-once distributed execution while maintaining correctness for repeated operations.

---

# Failed Queue

Jobs exceeding their retry limit are moved into a failed queue.

Purpose:

* Prevent endless retries
* Preserve failure history
* Allow future manual inspection or replay

---

# Database Design

PostgreSQL serves as the persistent source of truth.

The database stores:

Jobs:

* Job ID
* Status
* Priority
* Retry count
* Assigned worker
* Timestamps

Workers:

* Worker ID
* Status
* Last heartbeat
* Capacity

Execution History:

* Assignment records
* Retry attempts
* Completion status

Audit Information:

* Log references
* Metadata

Large execution artifacts are intentionally not stored directly in the database.

---

# Failure Handling

## API Crash

Persistent job metadata survives restart.

---

## Worker Crash

Heartbeat timeout detects failure.

Incomplete jobs are recovered.

---

## Scheduler Crash

Scheduler state can be reconstructed from persisted job and worker metadata.

---

## Duplicate Execution

Handled through idempotent job handlers.

---

## Retry Exhaustion

Jobs move into the failed queue.

---

# Scalability Considerations

The architecture supports horizontal scaling.

Additional workers can join by registering themselves.

The scheduler distributes work according to worker availability and capacity.

Job execution remains asynchronous and independent across workers.

---

# Design Decisions

## Server-generated Job IDs

The server owns job identity to prevent collisions and simplify persistence.

---

## Priority-based FIFO Scheduling

Higher priority jobs are processed first while maintaining FIFO ordering within each priority level.

---

## Heartbeat-based Health Checks

Simple and effective mechanism for worker health monitoring.

---

## At-least-once Execution

Chosen over exactly-once execution due to significantly lower complexity and practical reliability.

---

## PostgreSQL Persistence

Persistent metadata enables crash recovery, execution history, and fault tolerance.

---

# Future Improvements

Possible production enhancements include:

* Delayed jobs
* Exponential retry backoff
* Worker auto scaling
* Job cancellation
* Real-time progress updates
* Scheduled jobs
* Metrics and monitoring
* Distributed scheduler
* Dead letter queue replay
* Authentication and authorization

---

# Conclusion

This architecture provides a fault-tolerant distributed job execution platform capable of asynchronous processing, worker recovery, retry handling, execution tracking, and persistent state management while maintaining a practical balance between simplicity and scalability.