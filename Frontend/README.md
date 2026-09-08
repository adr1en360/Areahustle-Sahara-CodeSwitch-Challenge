# AreaHustle Frontend

A modern, high-performance web application built with **TanStack Start**, **React**, and **TypeScript**.

## 🚀 Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/router/latest/docs/framework/react/start/overview) (Full-stack React framework)
- **Routing:** [TanStack Router](https://tanstack.com/router) (Type-safe file-based routing)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Linting:** ESLint with type-aware rules

## 📁 Project Structure

The project follows TanStack Start's file-based routing conventions located in `src/routes/`.

```text
src/
├── components/     # Reusable UI components
├── routes/         # File-based routes (The heart of the app)
│   ├── __root.tsx  # The root layout/app shell
│   ├── index.tsx   # Home page (/)
│   └── ...         # Other routes
├── styles/         # Global styles
└── main.tsx        # Client entry point
```

## 🛠️ Routing Conventions

This project uses **TanStack Router**. Key conventions:

- `index.tsx` → `/`
- `about.tsx` → `/about`
- `users/$id.tsx` → `/users/:id` (Dynamic)
- `_layout.tsx` → Layout route (uses `<Outlet />`)
- `__root.tsx` → The mandatory global wrapper.

> **Note:** `routeTree.gen.ts` is auto-generated. Do not edit it manually.

## ⚡ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or pnpm

### Installation

```bash
npm install
```

### Development

Start the development server with HMR and route generation:

```bash
npm run dev
```

### Build

```bash
npm run build
```
