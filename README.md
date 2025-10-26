# TalentFlow – Mini Hiring Platform

TalentFlow is a React-based mini hiring system that simulates a real applicant tracking workflow **without a real backend**.
All data is stored locally using IndexedDB, and MirageJS is used to mock network APIs, delays, and error scenarios.

This project is designed to help understand concepts like:

-   Job posting workflows
-   Candidate stage progression
-   Assessment creation and submissions
-   Local persistence and optimistic UI patterns
-   Working with a mock API that behaves like a backend

---

## Features

### Jobs

-   Create and edit job postings
-   Archive and unarchive jobs
-   Drag-and-drop job reorder (with rollback on failure)
-   Filter by status, title and tags
-   Server-like paginated job list
-   Deep link route: `/jobs/:jobId`

### Candidates

-   Virtualized list of 1000+ candidates
-   Client-side search by name or email
-   Server-like filtering by current stage
-   Candidate profile timeline: `/candidates/:id`
-   Move candidates across stages using a Kanban board
-   Add notes containing `@mentions` (render only, no notifications)

### Assessments

-   Create assessment forms per job
-   Supported question types:
    -   Single choice
    -   Multi-choice
    -   Short text
    -   Long text
    -   Numeric with min and max validation
    -   File upload (stub display only)
-   Live preview panel
-   Save assessment structure locally (IndexedDB)
-   Store candidate responses locally
-   Conditional question visibility (example: show question only if previous answer meets a condition)

---

## API Simulation (MirageJS)

The app simulates a REST API:

```sh

GET /jobs
POST /jobs
PATCH /jobs/:id
PATCH /jobs/:id/reorder
GET /candidates
POST /candidates
PATCH /candidates/:id
GET /candidates/:id/timeline
GET /assessments/:jobId
PUT /assessments/:jobId
POST /assessments/:jobId/submit

```

Mirage also simulates:

-   **Latency:** 200ms to 1200ms (random)
-   **Failure rate:** 5–10% on write operations

All successful writes are mirrored to and restored from IndexedDB.

---

## Tech Stack

| Purpose           | Library                               |
| ----------------- | ------------------------------------- |
| UI Rendering      | React (TypeScript)                    |
| Routing           | React Router v7                       |
| Mock API          | MirageJS                              |
| Local Persistence | IndexedDB using Dexie / localForage   |
| Large Lists       | react-virtual (or similar)            |
| Drag & Drop       | react-beautiful-dnd (or alternatives) |

---

## Folder Structure

```
src/
    api/ Mirage server + fetch wrappers
    data/ Initial seed data
    db/ IndexedDB setup and sync helpers
    pages/ Jobs, Candidates, Assessments screens
    components/ Shared UI components
    hooks/ Custom data and UI logic
    utils/ General helpers
    App.tsx
    main.tsx

```

---

## Installation

```bash
git clone https://github.com/iemio/talentflow
cd talentflow
npm install
npm start
```

## Goals of This App

This project is meant to teach how to:

-   Think in terms of server interactions even when no backend exists
-   Use optimistic UI and handle rollback
-   Build scalable UI flows
-   Persist state beyond component memory
-   Design clean domain models
