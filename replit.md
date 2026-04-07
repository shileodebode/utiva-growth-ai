# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Utiva Growth AI Dashboard (`artifacts/utiva-growth-ai`)
- **Purpose**: AI-powered growth team command center for Utiva edtech
- **Preview Path**: `/`
- **Frontend**: React + Vite + Tailwind (teal/green brand theme)
- **Pages**: Dashboard, Leads, Enrollments, AI Workflows, Content AI, Courses

### API Server (`artifacts/api-server`)
- **Purpose**: Express 5 REST API backend
- **Preview Path**: `/api`

## Database Schema

- `leads` — prospective student leads with AI scoring
- `enrollments` — enrolled students with completion/engagement tracking
- `workflows` — AI automation workflow definitions
- `courses` — Utiva tech training catalog
- `content` — AI-generated marketing content pieces
- `activity` — activity feed for all workflow runs and events

## Key Features

- AI Lead Scoring (0-100 score + suggested action per lead)
- 6 pre-built AI automation workflows (lead follow-up, scoring, reminders, re-engagement, content push, drop alerts)
- Content AI generator (email, social post, WhatsApp, blog, ad copy with tone control)
- Live conversion funnel and enrollment trend charts
- At-risk student detection via AI engagement score
