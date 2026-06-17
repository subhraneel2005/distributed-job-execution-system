# AGENTS.md - AI Usage Log

## AI Tool Used
- **opencode** (CLI agent) — used for generating all implementation code, refactoring raw SQL to Drizzle ORM, debugging runtime errors, creating the Postman collection, and building the Next.js frontend.

## Development Approach

1. **Architecture first**: Core system design was drafted manually and refined via ChatGPT. The architecture doc (`ARCHITECTURE.md`) served as the single source of truth for all component decisions.
2. **Iterative build**: Components were built bottom-up: types → utils → db → services → api routes → background loops → entry point.
3. **Fail-fast debugging**: Each build error was surfaced via `tsc --noEmit` and resolved before moving to the next component.
4. **Refactor in-place**: Migrating from raw `pg` queries to Drizzle ORM was done as a single refactor pass, updating all service files simultaneously.
5. **Full-stack**: Frontend (Next.js + shadcn) was built after the backend was stable, consuming the REST API directly via fetch.

## Prompts Used

| Prompt | Purpose |
|--------|---------|
| "check the ARCHITECTURE.md and build whats there" | Initial full-system scaffolding |
| "do not use any orm for this raw Postgres (pg)" | Specified raw SQL approach (later overridden) |
| "use pino and pino-http for proper logging" | Added logging middleware requirement |
| "create a postman collection json" | Generated API testing collection |
| "replace raw sql with drizzle orm" | Full ORM migration of all DB queries |
| "add the scripts for db in package json" | Added Drizzle kit scripts |
| "add the Agent.md" + "Readme.md" | Documentation |
| "build a simple frontend" | Created Next.js dashboard, jobs, workers, and job detail pages with shadcn components |

## Workflow

```
ARCHITECTURE.md (design spec)
       ↓
  opencode agent (code generation)
       ↓
  tsc --noEmit (type-check)
       ↓
  npm run dev (runtime verification)
       ↓
  fix → repeat until clean
```
