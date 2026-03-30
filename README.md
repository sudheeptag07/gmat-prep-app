# Seeing GMAT

Next.js 14 + TypeScript workspace for a GMAT prep product built around strategy selection, pattern recognition, and speed-aware feedback.

## Product direction

The product is not meant to be a question bank or mock-test shell. The core loop is:

1. User attempts a question with a timer.
2. The app shows correctness, timing, and confidence alignment.
3. The explanation teaches the baseline method plus faster alternatives.
4. The user learns which method to choose next time, not just what the answer was.

The working product brief lives at `docs/gmat-strategy-engine-prd.md`.

## Current state

This repository still contains legacy routes and components from earlier projects. The public homepage now reflects the GMAT strategy-engine direction, while older dashboard and admin flows remain in the codebase until they are replaced or removed.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- LibSQL client (`@libsql/client`)

## Environment

Copy `.env.example` to `.env` and set the database and auth variables you need for the routes you plan to run.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npx tsc --noEmit
npm run build
```
