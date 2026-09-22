# Up Next - TV Show Tracker

## Overview

A personal TV show tracking application ("Up Next") that allows users to manage their watchlist by categorizing shows into "Watching", "Up Next", and "Watched" lists. The app integrates with TVMaze API for show search and airing status tracking. Features include:
- Multi-user authentication via Replit-managed Clerk, with local user rows for app data
- Responsive layout: tabs on mobile, 3-column kanban board on larger screens
- Drag-and-drop reordering within and between columns (via dnd-kit), whole-card drag (no visible handles)
- Airing status indicators showing "Available", "In Progress", "Coming Soon", "Ended", or upcoming episode dates
- Apple TV-inspired design with spectrum gradient effects
- **List sharing**: Share your watchlist via a unique URL (read-only for viewers)
- **Smart refresh**: 12-hour cooldown per show, auto-refresh on page load, rate-limited API calls
- **Star ratings**: 1-5 star ratings via modal popup, displayed as compact "N ⭐" on cards and shared lists, sortable
- **Per-column sorting**: Custom, A-Z, Z-A, Status, Next Airing, Rating
- **Column selector**: Desktop add-show modal allows choosing which column to add to

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management with optimistic updates
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark mode by default)
- **Animations**: Framer Motion for drag-and-drop reordering and smooth transitions
- **Typography**: DM Sans (body) and Outfit (display) fonts

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful API with typed routes defined in shared schema
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Validation**: Zod schemas with drizzle-zod integration for type-safe request/response handling
- **Authentication**: Clerk validates cookie-based web sessions; protected requests resolve `sessionClaims.userId` to the local users table

### Data Layer
- **Database**: PostgreSQL with connection pooling via `pg` Pool
- **Schema Location**: `shared/schema.ts` - single source of truth for database schema and TypeScript types
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/   # UI components including shadcn/ui
│       ├── hooks/        # Custom React hooks (use-shows, use-debounce)
│       ├── pages/        # Page components
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client and server
│   ├── schema.ts     # Drizzle schema and Zod types
│   └── routes.ts     # API route definitions with types
└── migrations/       # Database migrations
```

### Key Design Patterns
- **Shared Types**: API routes and validation schemas defined once in `shared/` and used by both client and server
- **Storage Interface**: `IStorage` interface in `server/storage.ts` abstracts database operations
- **Type-Safe API**: Route definitions include input validation and response types using Zod

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### External APIs
- **TVMaze API**: Used for searching TV shows and fetching airing status
  - Search: `GET /search/shows?q={query}`
  - Show details with next episode: `GET /shows/{id}?embed=nextepisode`
  - Status values: "Running", "Ended", "To Be Determined", "In Development"

### UI Libraries
- **Radix UI**: Headless UI primitives for accessible components
- **shadcn/ui**: Pre-built component library using Radix and Tailwind
- **Framer Motion**: Animation library for drag-and-drop and transitions
- **Lucide React**: Icon library

### Build Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **TypeScript**: Type checking across the entire codebase