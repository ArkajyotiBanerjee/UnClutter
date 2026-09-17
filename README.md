# UnClutter

UnClutter is a full-stack student task management application designed to help students organize, track, and complete their daily tasks without unnecessary complexity.

It supports both guest usage through browser storage and authenticated usage with persistent PostgreSQL storage.

## Live Demo

https://unclutter-app-nine.vercel.app

## GitHub Repository

https://github.com/ArkajyotiBanerjee/UnClutter

---

## Features

- Create, edit, delete, and complete tasks
- Task descriptions, priorities, and due dates
- All / Pending / Completed task views
- Search and priority filtering
- Guest mode using browser `localStorage`
- Google authentication
- PostgreSQL persistence for authenticated users
- Guest task migration after Google sign-in
- Statistics dashboard with completion and priority breakdowns
- Responsive Neo-Brutalist UI
- Loading, empty, validation, and error states

---

## Tech Stack

**Frontend**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide React

**Backend & Data**
- Next.js Route Handlers
- NextAuth.js
- Prisma ORM
- PostgreSQL
- Neon

**Validation & Deployment**
- Zod
- Vercel
- GitHub

---

## Architecture

UnClutter uses a single Next.js application containing the frontend and backend API routes.

```text
                    ┌─────────────────────┐
                    │     Next.js App     │
                    │ React + TypeScript  │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
             Guest                      Authenticated
                │                             │
                ▼                             ▼
          localStorage                   NextAuth.js
                                              │
                                              ▼
                                         Task API
                                              │
                                              ▼
                                            Prisma
                                              │
                                              ▼
                                       PostgreSQL / Neon
````

### Guest → Authenticated Migration

Guest tasks stored in `localStorage` are migrated to the authenticated user's PostgreSQL account when they sign in with Google.

---

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   └── tasks/
│   ├── statistics/
│   └── page.tsx
│
├── components/
│   ├── AppNavigation.tsx
│   ├── BackgroundLayer.tsx
│   ├── StatisticsPage.tsx
│   ├── TaskModal.tsx
│   ├── TaskRow.tsx
│   └── UnClutterApp.tsx
│
├── lib/
│   ├── auth.ts
│   ├── guestStorage.ts
│   ├── prisma.ts
│   ├── taskApi.ts
│   └── validations/task.ts
│
└── types/

prisma/
├── migrations/
└── schema.prisma
```

---

## API

| Method | Endpoint         | Purpose                          |
| ------ | ---------------- | -------------------------------- |
| GET    | `/api/tasks`     | Fetch authenticated user's tasks |
| POST   | `/api/tasks`     | Create a task                    |
| PATCH  | `/api/tasks/:id` | Update a task                    |
| DELETE | `/api/tasks/:id` | Delete a task                    |

The API validates task input with Zod and checks authentication and task ownership before modifying data.

---

## Validation & Error Handling

The application handles:

* Invalid or missing task titles
* Invalid task data and dates
* Unauthorized API requests
* Access to another user's tasks
* Failed API operations
* Loading and empty states

New tasks can only have a due date of today or later.

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/ArkajyotiBanerjee/UnClutter.git
cd UnClutter
npm install
```

### 2. Configure environment variables

Create `.env` in the project root:

```env
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Set up Prisma

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Start the application

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Google OAuth

For local development:

**Authorized JavaScript origin**

```text
http://localhost:3000
```

**Authorized redirect URI**

```text
http://localhost:3000/api/auth/callback/google
```

For production, use:

```text
https://unclutter-app-nine.vercel.app
https://unclutter-app-nine.vercel.app/api/auth/callback/google
```

---

## Deployment

The application is deployed on Vercel and connected to GitHub.

Production environment variables:

```text
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Prisma Client is generated during installation so deployments work correctly with Vercel's dependency caching.

**Live:** [https://unclutter-app-nine.vercel.app](https://unclutter-app-nine.vercel.app)

---

## AI Usage Disclosure

AI tools were used during development for UI refinement, debugging assistance, and deployment troubleshooting.

The application's core functionality, authentication, task CRUD, database persistence, validation, guest-to-authenticated migration, UI structure and production flows were manually developed & tested before submission.

---

## License

Created as part of a Full Stack Developer internship assignment.

