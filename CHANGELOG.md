# Changelog

All notable changes to the FIFA Tournament Operations Center project are documented in this file.

## [RC-1] - 2026-07-17

### Added
- Created `RELEASE_NOTES.md` documenting major dashboard capabilities, technology stack, and optimizations.
- Created `PROJECT_STRUCTURE.md` documenting the repository outline and structural folders.
- Created `CHANGELOG.md` tracking the software evolution.

### Changed
- **Performance Optimizations**:
  - Implemented lazy loading (`React.lazy` and `React.Suspense`) for non-initial tab widgets and diagnostics panels in `App.tsx`.
  - Added Rollup `manualChunks` configuration in `vite.config.ts` to separate react core framework and lucide icons.
- **Enterprise UI Polish**:
  - Polished global stylesheets and added typography scale coordinates in `index.css`.
  - Removed aggressive uppercase styles on buttons in `Button.tsx` and rounded borders (`rounded-md`).
  - Switched sharp badges into rounded-full pill shapes in `Badge.tsx`.
  - Restructured `WeatherWidget.tsx` columns to stack vertically (`grid-cols-1`) when placed inside the narrow sidebar.
  - Adjusted margins, paddings, and header hierarchies across `TopBar.tsx`, `Sidebar.tsx`, `PageHeader.tsx`, `Breadcrumbs.tsx`, and `Workspace.tsx`.
