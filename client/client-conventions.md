# Frontend Development Conventions
This document outlines the conventions, patterns, and workflows used in the AskZoie User Dashboard frontend. It is designed to help AI-assisted IDEs follow the established project style and architecture.
## 1. Tech Stack
- **Framework**: Vite + React 19
- **Routing**: TanStack Router (File-based)
- **State Management**:
    - **Server State**: TanStack React Query v5
    - **Global Client State**: Zustand
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS 4.0)
- **Forms**: React Hook Form + Zod
- **API Client**: Axios
- **Utilities**: `clsx`, `tailwind-merge` (via `cn` utility), `date-fns`, `js-cookie`.
## 2. Project Structure
The project follows a modular, feature-based architecture:
```text
src/
├── assets/          # Static assets (images, icons)
├── components/      # Generic UI components
│   ├── ui/          # shadcn/ui base components
│   └── layout/      # Sidebar, Header, etc.
├── config/          # App-wide configuration (API client, navigation)
├── context/         # React Contexts (Theme, Font)
├── features/        # Feature-based modules
│   └── [feature]/
│       ├── components/ # Feature-specific components
│       ├── data/       # Types, schemas, mock data
│       └── index.tsx   # Feature entry point
├── hooks/           # Global custom hooks
├── lib/             # Third-party library configs (utils)
├── routes/          # TanStack Router routes (file-based)
├── stores/          # Zustand global stores
├── types/           # Global TypeScript types
└── utils/           # Utility functions
```
## 3. Styling & UI Conventions
### Tailwind CSS 4.0
- Styles are defined using Tailwind CSS 4.0.
- Theme tokens (colors, fonts, etc.) are defined in `src/index.css` using CSS variables and `@theme inline`.
- Colors use the `oklch` format.
- Custom utilities are defined using `@utility`.
### UI Components (shadcn/ui)
- Components are stored in `src/components/ui`.
- Use `class-variance-authority` (CVA) for managing component variants.
- Use the `cn` utility (`@/lib/utils`) to merge Tailwind classes.
- Prefer Radix UI primitives for complex accessible components.
- Components should support `asChild` prop where applicable (using Radix `Slot`).
## 4. State Management
### Server State (React Query)
- Use `useQuery` for fetching and `useMutation` for data-modifying operations.
- `queryKey` should be an array (e.g., `['user-assistants', assistantId]`).
- Define `queryFn` using the shared axios instance.
- Global error handling is configured in `src/main.tsx`.
### Client State (Zustand)
- Store definitions are in `src/stores`.
- Use the `create<T>()((set) => ({ ... }))` pattern.
- Persistent state (like auth tokens) is handled manually with `js-cookie`.
## 5. API Interaction
- Use the shared axios instance `api` from `@/config/apiClient`.
- The `api` instance automatically:
    - Sets the `baseURL` from `VITE_API_URL`.
    - Attaches the `Authorization` bearer token from the auth store.
    - Redirects to `/sign-in` on `401 Unauthorized`.
    - Handles `500` errors globally with toasts.
## 6. Routing (TanStack Router)
- Routes are defined in `src/routes`.
- Follow the file-based routing convention:
    - `(auth)`: Group for authentication routes.
    - `_authenticated`: Group for protected routes.
    - `index.tsx`: Main route for a path.
- Use `createFileRoute` for defining routes.
- Integrate features by importing the feature's main component into the route file.
## 7. Form Handling
- Use `react-hook-form` paired with `zod` for validation.
- Define Zod schemas in the feature's `data/schema.ts` file.
- Wrap form fields with components from `src/components/ui/form.tsx`.
## 8. Development Workflow
- **Linting**: ESLint with TypeScript and React plugins.
- **Formatting**: Prettier with `prettier-plugin-tailwindcss` and `@trivago/prettier-plugin-sort-imports`.
- **Imports**: Use the `@/` alias for absolute imports from the `src` directory.
- **Naming**:
    - Components: PascalCase (e.g., `UserAssistants.tsx`).
    - Hooks: camelCase starting with `use` (e.g., `useAuth.ts`).
    - Utilities/Files: kebab-case (e.g., `api-client.ts`).
