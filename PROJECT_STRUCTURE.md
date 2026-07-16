# Project Structure

This document outlines the complete directory layout of the FIFA Tournament Operations Center codebase.

```
FIFA-Conjustion_Control/
├── assets/                     # Static media and graphic assets
├── src/                        # Main React application source code
│   ├── components/             # Reusable UI widgets and elements
│   │   ├── dashboard/          # Specialized operational panel widgets
│   │   ├── feedback/           # Load spinners and progress bars
│   │   ├── forms/              # Structured input fields and forms
│   │   └── ui/                 # Core design system components (Button, Card, Badge)
│   ├── context/                # Global React context state modules
│   │   ├── CollaborationContext.tsx
│   │   └── TournamentContext.tsx
│   ├── hooks/                  # Custom React hooks
│   ├── layout/                 # Application shell containers
│   │   ├── Breadcrumbs.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── Workspace.tsx
│   ├── repositories/           # State simulation and mock data registers
│   ├── services/               # Core services (AI orchestration, telemetry observability)
│   ├── types/                  # TypeScript interface and type declarations
│   ├── utils/                  # Shared utility code
│   ├── App.tsx                 # Main application controller and views router
│   ├── index.css               # Global stylesheets, custom HSL themes, and Tailwind v4 directives
│   └── main.tsx                # Client bundle mount entrypoint
├── .env.example                # Example configuration environment templates
├── package.json                # Project configuration script dependencies
├── tsconfig.json               # TypeScript compiler rules configuration
└── vite.config.ts              # Vite server and Rollup bundler configurations
```

## Directory Explanations

### `/src/components`
Houses the layout building blocks of the TOC platform. It is split into `ui/` (highly reusable basic atoms), `forms/` (user feedback controls), and `dashboard/` (heavy analytical blocks like `IncidentOperationsWidget` or `WeatherWidget`).

### `/src/context`
Houses contextual state managers. `TournamentContext` keeps track of simulation stages, tickets, lists, and incidents. `CollaborationContext` manages operator presences, locking leases, and messaging.

### `/src/layout`
Defines the structure of the HUD interface: the `TopBar` headers, `Sidebar` navigation, and page `Workspace` layouts.

### `/src/services`
Defines the functional pipelines: `aiRuntime` triggers validation prompts via LLMs, and `observability` tracks performance and transaction logs.
