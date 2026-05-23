## Demo: https://nest-todo-mu.vercel.app (render backend might take a minute to load)

## 🚀 Key Features

* **Strict Category Limits:** Enforces a hard limit of **at most 5 active tasks** per category using backend validation and smooth frontend alerts.
* **Instant Interaction:** Interactive tasks with custom Lucide icons mapping to categories (`Work`, `Personal`, `Shopping`, `Health`, `Education`, and custom ones).
* **Click-to-Select Bulk Actions:** Click anywhere on a task card to select it, allowing you to bulk **Complete** or bulk **Delete** multiple tasks at once.
* **Inline Task Editing:** Tap the Pencil icon to open a premium Radix-driven **Shadcn Dialog** to update descriptions and categories on the fly.
* **Optimistic Grace Periods:**
  * **Complete / Delete / Bulk Actions** trigger a **5-second Sonner Toast notification** with an **Undo** action button.
  * Revert your action instantly, or let the timer run down to finalize database persistence.

---

## 🛠 Tech Stack

* **Frontend:** React (Vite) + TypeScript + Tailwind CSS v4 + Radix UI + React Hook Form + Zod + Sonner + Lucide Icons.
* **Backend:** Node.js + NestJS + Prisma 7 (configured with SQLite adapter).
* **Database:** SQLite (`backend/prisma/dev.db`).

---

## 📦 Run with Docker (Easiest Method)

Run the entire application in a single command using Docker Compose:

```bash
docker compose up --build
```

* **Frontend:** Available at [http://localhost](http://localhost) (Port 80)
* **Backend API:** Running at [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Run Locally (Manual Mode)

### 1. Run the Backend API
```bash
cd backend
npm install
npx prisma db push
npm run start:dev
```
*Backend runs on: [http://localhost:3000](http://localhost:3000)*

### 2. Run the Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on: [http://localhost:5173](http://localhost:5173)*

---

## 🧪 Running Tests

A unit test suite is fully set up in the backend to cover the core category business rules.

To run backend Jest unit tests:
```bash
cd backend
npm run test
```
To run targeted unit tests:
```bash
npx jest src/todos/todos.service.spec.ts
```
