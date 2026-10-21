# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"ATTO Sementes — Governança de Soluções & Ativos (Industriatto)" is a single-page React app that manages IT solution/asset governance: intake, risk diagnostics, action plans, criticality evolution tracking, and effort/schedule estimation for internal low-code/vibe-coding projects. It was originally scaffolded by Google AI Studio (see `metadata.json` and the AI Studio comments in `vite.config.ts`); the `@google/genai` dependency and the unused `GEMINI_API_KEY`/`APP_URL` env vars from that scaffold have since been removed, as no code ever called the Gemini API.

Data is persisted to Supabase (`src/services/supabase.ts`, schema changes via `prisma/migrations/` + `npm run migrate`) with a `localStorage` cache (see `src/utils/storage.ts`).

## Commands

```bash
npm install        # install dependencies
npm run dev         # start Vite dev server on http://localhost:3000
npm run build        # production build
npm run preview       # preview the production build
npm run lint         # type-check only (tsc --noEmit); there is no separate test suite or linter config
npm run clean        # remove dist/
```

There are no automated tests in this repo. `npm run lint` (a `tsc --noEmit` pass) is the only verification step available.

A `bun.lock` file is present, but this environment installs and runs fine with plain `npm`.

## Architecture

**Single-file routing and state, no router/state library.** `src/App.tsx` owns all top-level state (`projects`, `userRole`, `governanceConfig`, `route`) and is the only place that talks to `localStorage` via `loadState`/`saveState`. Routing is a hand-rolled `Route` union (`{name: 'portfolio', view?} | {name: 'project', projectId, tab} | {name: 'settings', section?} | ...`) synced to `window.location.hash` (`parseHashToRoute`/`syncRouteToHash` in `App.tsx`), not `react-router`. All views are rendered conditionally from `App.tsx` based on `route`; there's no nested component routing.

**No in-page tabs.** Every sub-navigation (portfolio views, project tabs, settings sections) lives in the contextual sub-menu of `Sidebar.tsx`, driven by the route; pages receive the active view/section as a prop. Don't add tab bars or segmented switchers inside pages.

**Data model** (`src/types.ts`): a `SolutionProject` is the central entity — it carries GLPI asset metadata, a risk diagnostic (`criteria`, `dimensionsInitial`, `initialScore`), an `actionPlan` (tasks with `riskPointsImpact` and a `stage` E0–E6), `meetingLogs` (also with `stage`), `artifacts` (document links), and an `estimation` (effort/schedule inputs). `technicalDoc` is legacy (the "Documentação Viva" was removed from the UI); it is still loaded/saved so old data isn't lost, and only `classification` is edited (in the Ficha).

**Project workspace navigation** (`ProjectTab` = `'overview' | 'ficha' | 'estimation' | StageTab`): the main navigation is the governance pipeline itself — one tab per stage E0–E6 (`StageView`: stage tasks via `StageTaskList`, stage meetings via `MeetingLogPanel`, the risk diagnostic inside E1, exit criteria + risk evolution inside E6, and the stage-advance confirmation). `overview` (`ProjectOverviewView`, the default) answers "em que pé está" using `getProjectStatusSummary` in `src/utils/projectStatus.ts`; `ficha` (`ProjectFichaView` + `DocumentLinksPanel`) holds asset data and the project's documents as links only (no uploads); its long text fields (`objective`, `initialDoc`) use the TipTap `RichTextEditor` (HTML, legacy plain text converted by `toEditorHtml`) and every save that changes them appends to `textVersions` (restorable via `TextVersionHistoryModal`); `estimation` is the effort/schedule view. Old tab ids in hashes/saved routes (`glpi`, `diagnostic`, ...) are mapped to the new ones. Tasks/meetings saved before stages existed have no `stage`: `inferActionStage` (by title) and `getMeetingStage` (by date vs. schedule) suggest one, shown as "etapa sugerida" until the record is saved again. Stage labels in the UI always use `stageLabel()` ("E2 - Documentação mínima e acessos"), never the bare code.

**Risk scoring** (`src/utils/riskCalculations.ts`): risk level thresholds and per-level colors are derived from the *active* `GovernanceConfig`/`GovernanceSettings` (`src/config/governanceConfig.ts`), not hardcoded — `computeResidualScore` subtracts completed/in-progress `actionPlan` items' `riskPointsImpact` from a project's `initialScore` to get the current/projected residual score and risk level (`BAIXO/MEDIO/ALTO/CRITICO`). `computeDimensionEvolution` splits mitigation across `Segurança`/`LGPD`/`Operacional` dimensions (with `Governança` actions split 50/50 across Segurança/Operacional).

**Governance settings are runtime-configurable.** `SettingsView` lets an admin edit `GovernanceSettings` (risk weights/thresholds, estimation base hours/factors, per-`ProjectType` stage config, modules/discounts catalogs, checklists) without a code change; the active settings are held in module-level state via `getActiveConfig`/`setGlobalActiveSettings` in `src/config/governanceConfig.ts` and persisted alongside projects in the same `localStorage` blob.

**Role-based permissions** (`src/utils/permissions.ts`): a single `can(role, action)` (or `can(action, role)`) function gates UI actions for the two roles, `admin` (unrestricted) and `padrao` (view/annotate only — no settings, deletes, stage advancement, or estimation edits). There's no auth; `userRole` is just a simulated toggle in the Navbar for demoing permission differences.

**Estimation engine** (`src/data/estimationCatalog.ts` + `src/utils/estimation.ts` + `SettingsView`/`EstimationScheduleView`): effort and schedule are computed per `GovStage` (E0–E6) from base hours by `ProjectType` (A=Google Workspace/App Script, B=Container/VPS, C=No-code/external), plus toggleable `modulesCatalog`/`discountsCatalog` adjustments and optimistic/realistic day factors — all pulled from the active `GovernanceSettings`, never hardcoded in the view components.

**Persistence & compatibility shims**: `src/utils/storage.ts` reads/writes a single `localStorage` key (`atto_governanca_state_v1`) holding `{projects, settings, route, role, savedAt}`, de-duplicates projects by `id`, and normalizes a couple of renamed fields (`isPriorityForManagement`, `actionRequiredFromManagement`) from older field names for backward compatibility with previously saved state. It also supports exporting/importing the full state as a JSON backup file (`exportStateAsJson`/`importStateFromJson`).

## TypeScript/build notes

- Path alias `@/*` → project root (configured in both `tsconfig.json` and `vite.config.ts`).
- `tsconfig.json` has `noEmit: true`; type-checking is done via `npm run lint`, not `tsc build`.
- HMR/file-watching can be disabled via `DISABLE_HMR=true` (set by the AI Studio hosting environment); irrelevant for local dev.
