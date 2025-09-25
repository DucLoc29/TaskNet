# TaskNest

## How to run:
- `npm install`
- create `.env` with `VITE_API=http://localhost:4000/api` (or leave empty)
- `npm run dev`

## Features:
- create task, list with filters + pagination, inline status update, delete, stats.

## Endpoints used:
- GET /todos
- GET /todos/stats
- POST /todos
- PATCH /todos/:id
- DELETE /todos/:id
