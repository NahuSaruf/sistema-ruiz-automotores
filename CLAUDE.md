# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `project/` directory (the actual app root — `package.json` lives here, not at the repo root).

- `npm run dev` — start the Vite dev server
- `npm run build` — production build (outputs to `dist/`)
- `npm run preview` — serve the production build locally
- `npm run lint` — ESLint over the whole project
- `npm run typecheck` — `tsc --noEmit` using `tsconfig.app.json`

There is no test runner configured in this project (no test script, no test files).

## Project origin

This app was scaffolded and is still edited via [bolt.new](https://bolt.new/~/sb1-iqrfixwd) (see `.bolt/config.json`, `.bolt/prompt`). Per `.bolt/prompt`, the standing UI conventions are: Tailwind CSS for styling, `lucide-react` for all icons, and avoid adding new UI/icon/theming packages unless truly necessary.

## Architecture

This is a single-page React + TypeScript + Vite app for "Ruiz Automotores" (a Renault dealership plan-de-ahorro / financing management portal), in Spanish. There is no router — `src/App.tsx` is a monolithic component that switches between views via local `useState`, and also inlines several modals (contact, benefits, model catalog, version spec sheets) directly in JSX rather than as separate components.

**View model (`App.tsx`):** a single `view` state (`'home' | 'user' | 'cliente' | 'admin' | 'nuevo'`) drives which top-level screen renders. Login is a single free-text field: typing `ADMIN` routes straight to the admin dashboard (no real auth); any other input is looked up asynchronously via `buscarClientePorConsultaConNube` (Supabase first, falling back to `localStorage`) and routes to the client dashboard with whatever `ClienteCartera` match (or `null`) comes back.

**Two dashboards sharing data through localStorage + optional Supabase:**
- `DashboardAdmin.tsx` — staff-facing. Admin uploads Excel/CSV files (via `xlsx` + `src/utils/excelParser.ts`) across several tabs: "Cartera General" (client roster), "Adjudicados" (SAP award report), and "Licitaciones" (the "5 mejores ofertas" bidding-history report). Each dataset is parsed client-side, deduped/merged via `combinar*ConConteo` helpers, and persisted to `localStorage` (`cartera_general_ruiz`, `adjudicados_ruiz`, `mejores_ofertas_ruiz`). If Supabase env vars are set, saves also upsert to the cloud (`guardarCarteraEnNube`/`guardarAdjudicadosEnNube`) and on mount the admin panel pulls cloud data and merges it into localStorage (cloud wins on conflict — see `fusionarPorGrupoOrden` in `DashboardAdmin.tsx`).
- `DashboardCliente.tsx` — client-facing self-service portal. Reads the same `localStorage`-backed data (via `App.tsx`'s login lookup) to personalize the profile header, and independently reads `cargarMejoresOfertas()` for the client's bidding history. Also renders "Rombito", an inline rule-based chat widget (not backed by any LLM) with an identity gate (DNI or "Grupo y Orden" must match a regex before any query is answered), keyword-based intent tagging that picks a canned reply per department, business-hours-aware suffixes, and `!`-prefixed staff-only secret commands (`!broker`, `!fabrica`) that bypass the identity gate. All of this logic lives inline in `DashboardCliente.tsx`, not in the orphaned `RombitoChat.tsx`.

**`src/utils/excelParser.ts`** is the canonical Excel-ingestion and persistence layer. It normalizes SAP-style export column names (many possible header spellings per logical field, matched case-insensitively via `buscarValorColumna`) and status strings (`normalizarEstadoSAP`) into clean shapes (`ClientePlan`, `ClienteCartera`, `AdjudicadoSAP`, `MejorOferta`), owns their `localStorage` read/write/merge functions, and also does bidirectional SAP-code ↔ display-name translation (`traducirModeloSAP` for the admin/technical view, `formatearModeloCliente` for the simplified client-facing view) via the `MAPPING_MODELOS_SAP` table. When adding new spreadsheet-derived fields, extend this file's column-alias lists and mapping tables rather than special-casing parsing elsewhere.

**`src/lib/supabase.ts`** creates the Supabase client only if `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set (see `.env.example`); otherwise `supabase` is `null` and every exported function degrades to a no-op/`null` return, so the app always keeps working purely off `localStorage`. All cloud calls are wrapped in try/catch and never throw. `nubeConfigurada` is the boolean flag components check before showing cloud-related UI.

**`src/utils/condicionesComerciales.ts`** stores the small set of admin-editable promo copy (title, description, featured plan/cuota) in `localStorage` (`condiciones_comerciales_ruiz`); `DashboardCliente.tsx` listens for the `storage` event to pick up admin edits live if both panels are open.

**Dead/orphaned code:** several components under `src/components/` are not imported from `App.tsx` or from each other and are effectively unused by the running app: `BaseClientes.tsx`, `Catalogo.tsx`, `ConsultarPlan.tsx`, `DashboardOperativo.tsx`, `Estadisticas.tsx`, `Footer.tsx`, `Hero.tsx`, `Login.tsx`, `MiCuentaModal.tsx`, `PortalCliente.tsx`, `RombitoChat.tsx`. Likewise `src/data/vehiculos.ts` has no importers. `BaseClientes.tsx` contains an alternate, older `localStorage`-backed client-list implementation (key `ruiz_clientes_plancrm`) that predates what `excelParser.ts` now does — don't assume these orphaned files are wired up, and check actual imports before treating any component as "in use."

**Vehicle/model image assets** (`Boreal*.png`, `Duster*.png`, `Kangoo*.png`, `Kardian*.png`, `Koleos*.png`, `Kwid*.png`, `Master*.png`, etc.) live in `public/` and are referenced by root-relative paths (e.g. `/Kwid.png`). Numbered variants (`Duster Intens MT 1.png` … `...6.png`) are 360°-style rotation frames consumed by mouse/touch-drag interactions — see `VisorVersion360` in `App.tsx` (used by the model catalog's spec-sheet modal) and the equivalent inline 360° viewer in `DashboardCliente.tsx`. `dist/` is a committed build output mirroring `public/` — don't hand-edit files there; regenerate via `npm run build`.
