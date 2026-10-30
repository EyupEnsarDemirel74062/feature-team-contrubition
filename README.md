# Vistula Task Manager

Rana Betül Karahan — Student ID **72546**

A simple HTML, CSS and JavaScript application for Practical Assignment 1 in the Team Project course. It uses the Supabase REST API to save tasks in PostgreSQL and is designed to run on GitHub Pages.

## Features

- List tasks and add a title with an optional description.
- Edit an existing task.
- Mark a task completed or incomplete.
- Delete a task.
- Keep changes in the database after refreshing the page.
- Show errors when a database request fails.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Main page, form and task list |
| `style.css` | Responsive page styling |
| `app.js` | Rendering, form events and Supabase REST requests |
| `config.json` | Public Supabase project URL, publishable key and table name |
| `supabase-setup.sql` | Table, demonstration data and public CRUD policies |

## Database setup

1. Create a separate free Supabase demonstration project.
2. Run `supabase-setup.sql` in its SQL Editor. This is a first-time setup script, not a reset script.
3. Put the project URL and **publishable** API key into `config.json`:

```json
{
  "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
  "supabasePublishableKey": "sb_publishable_YOUR_PUBLIC_KEY",
  "tableName": "tasks"
}
```

The `tasks` table has an automatically generated BIGINT `id`, required TEXT `title`, optional TEXT `description`, and BOOLEAN `completed` (default `false`). RLS stays enabled. The policies allow anonymous CRUD only on this demonstration table. Anyone with the public application can change its demonstration tasks. Do not put personal or production data in this project.

Never add a secret API key, service-role key or database password to this repository. A publishable key goes in the `apikey` header; it is not used as a bearer JWT.

## Run and deploy

For local development, serve this directory with a static HTTP server, for example `python3 -m http.server 8000`, and open `http://localhost:8000`. Opening `index.html` as a local file will not load JSON using `fetch()`.

For GitHub Pages, use repository **vistula-task-manager**, branch **main**, folder **/ (root)**.

Expected URLs after deployment:

- Application: https://vistula-team-project-72546.github.io/vistula-task-manager/
- Repository: https://github.com/vistula-team-project-72546/vistula-task-manager

## How it works

`app.js` first loads `config.json`, then retrieves tasks with `GET`. Adding uses `POST`, editing and changing completion use `PATCH`, and deletion uses `DELETE`. Editing also fetches the latest record by ID. A successful change is followed by a fresh list request. User-entered text is displayed with `textContent`, so HTML in a task is treated as text.

The same form handles creation and editing. `editingId` is empty for a new task and stores the selected task's ID while editing. Completing a task changes its database value, not just its appearance.

## Partner contribution — pending

The partner must fork this repository, make a branch, and add `contribution.html` and `contribution.json` through a Pull Request from their own dedicated course account. Those files are intentionally absent from this initial individual implementation.

The HTML page must fetch `contribution.json` when **Show Contributor** is clicked and display `contributorStudentId` inside `#contributor-student-id`. It must have a **Team Contribution** heading, a button with ID `load-contributor`, and a link back to `index.html`. The JSON must contain the PR author's student ID, not my ID.

- Incoming partner PR: pending.
- My outgoing PR to the partner's repository: pending.

Replace these entries with the links after both PRs have been reviewed and merged. The assignment is not complete until both contributions are merged and the deployed application, contributor page and JSON work publicly.

## Manual checks before submission

1. Open the live site and confirm tasks load from Supabase.
2. Add a task, refresh, and confirm it remains.
3. Edit its title and description and refresh again.
4. Mark it completed, then incomplete.
5. Delete the test task and confirm it stays deleted after refreshing.
6. Verify an understandable error appears when a request fails.
7. Check the partner page, its JSON and both merged PR links.

Submit only the working application's GitHub Pages URL on Platon.
