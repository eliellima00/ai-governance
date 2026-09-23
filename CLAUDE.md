# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"ATTO Sementes — Governança de Soluções & Ativos (Industriatto)" is a single-page React app that manages IT solution/asset governance: intake, risk diagnostics, action plans, criticality evolution tracking, and effort/schedule estimation for internal low-code/vibe-coding projects. It was originally scaffolded by Google AI Studio (see `metadata.json` and the AI Studio comments in `vite.config.ts`); the `@google/genai` dependency and the unused `GEMINI_API_KEY`/`APP_URL` env vars from that scaffold have since been removed, as no code ever called the Gemini API.

There is no backend. All application data is seeded from `src/data/` and persisted client-side in `localStorage` (see `src/utils/storage.ts`).

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

**Single-file routing and state, no router/state library.** `src/App.tsx` owns all top-level state (`projects`, `userRole`, `governanceConfig`, `route`) and is the only place that talks to `localStorage` via `loadState`/`saveState`. Routing is a hand-rolled `Route` union (`{name: 'portfolio'} | {name: 'project', projectId, tab} | {name: 'settings'}`) synced to `window.location.hash` (`parseHashToRoute`/`syncRouteToHash` in `App.tsx`), not `react-router`. All views are rendered conditionally from `App.tsx` based on `route`; there's no nested component routing.

**Data model** (`src/types.ts`): a `SolutionProject` is the central entity — it carries GLPI asset metadata, a risk diagnostic (`criteria`, `dimensionsInitial`, `initialScore`), an `actionPlan` (mitigation items with `riskPointsImpact`), an `estimation` (effort/schedule inputs), and a `technicalDoc` block (LGPD/security/infra "doc viva"). Project workspace tabs (`glpi | artifacts | diagnostic | action_plan | evolution | estimation`) each map to one component in `src/components/` and one `ProjectTab` value.

**Risk scoring** (`src/utils/riskCalculations.ts`): risk level thresholds and per-level colors are derived from the *active* `GovernanceConfig`/`GovernanceSettings` (`src/config/governanceConfig.ts`), not hardcoded — `computeResidualScore` subtracts completed/in-progress `actionPlan` items' `riskPointsImpact` from a project's `initialScore` to get the current/projected residual score and risk level (`BAIXO/MEDIO/ALTO/CRITICO`). `computeDimensionEvolution` splits mitigation across `Segurança`/`LGPD`/`Operacional` dimensions (with `Governança` actions split 50/50 across Segurança/Operacional).

**Governance settings are runtime-configurable.** `SettingsView` lets an admin edit `GovernanceSettings` (risk weights/thresholds, estimation base hours/factors, per-`ProjectType` stage config, modules/discounts catalogs, checklists) without a code change; the active settings are held in module-level state via `getActiveConfig`/`setGlobalActiveSettings` in `src/config/governanceConfig.ts` and persisted alongside projects in the same `localStorage` blob.

**Role-based permissions** (`src/utils/permissions.ts`): a single `can(role, action)` (or `can(action, role)`) function gates UI actions for the two roles, `admin` (unrestricted) and `padrao` (view/annotate only — no settings, deletes, stage advancement, or estimation edits). There's no auth; `userRole` is just a simulated toggle in the Navbar for demoing permission differences.

**Estimation engine** (`src/data/estimationCatalog.ts` + `src/utils/estimation.ts` + `SettingsView`/`EstimationScheduleView`): effort and schedule are computed per `GovStage` (E0–E6) from base hours by `ProjectType` (A=Google Workspace/App Script, B=Container/VPS, C=No-code/external), plus toggleable `modulesCatalog`/`discountsCatalog` adjustments and optimistic/realistic day factors — all pulled from the active `GovernanceSettings`, never hardcoded in the view components.

**Persistence & compatibility shims**: `src/utils/storage.ts` reads/writes a single `localStorage` key (`atto_governanca_state_v1`) holding `{projects, settings, route, role, savedAt}`, de-duplicates projects by `id`, and normalizes a couple of renamed fields (`isPriorityForManagement`, `actionRequiredFromManagement`) from older field names for backward compatibility with previously saved state. It also supports exporting/importing the full state as a JSON backup file (`exportStateAsJson`/`importStateFromJson`).

## TypeScript/build notes

- Path alias `@/*` → project root (configured in both `tsconfig.json` and `vite.config.ts`).
- `tsconfig.json` has `noEmit: true`; type-checking is done via `npm run lint`, not `tsc build`.
- HMR/file-watching can be disabled via `DISABLE_HMR=true` (set by the AI Studio hosting environment); irrelevant for local dev.
