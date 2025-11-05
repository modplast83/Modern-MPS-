## Modern MPS – AI Coding Agent Quickstart

Purpose: Equip AI assistants to make safe, productive changes fast in this plastic bag manufacturing MPS (TypeScript full‑stack, Arabic/English, strict data integrity).

### 1. Core Architecture (Big Picture)
- Frontend: React + Vite + Wouter (minimal routing) + TanStack Query (server state) + Tailwind/Radix UI.
- Backend: Express (ESM) + Drizzle ORM on Neon PostgreSQL (serverless WebSocket driver) – single `db` instance in `server/db.ts` (never recreate connections).
- Shared domain & types in `shared/` (especially `shared/schema.ts` + Drizzle/Zod integration).
- Production flow: Orders → Production Orders → Rolls → (Film → Printing → Cutting → Completed). Quantity constraints enforced centrally.

### 2. Critical Data Integrity (لا تخرق القواعد)
Defined in `shared/schema.ts` + enforced by `server/services/data-validator.ts` + transactional middleware:
1. Σ ProductionOrder.quantity_kg ≤ Order.total_quantity + tolerance.
2. Σ Roll.weight_kg ≤ ProductionOrder.final_quantity_kg + tolerance.
3. Inventory (current_stock) must never go negative.
Always wrap multi‑table mutations with transaction utilities in `server/middleware/transaction.ts`.

### 3. Key Conventions
- ESM only: use `.js` in relative imports (no CommonJS require).
- Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`.
- Bilingual UI: Arabic primary text with English fallback; ensure RTL-safe layout & error messages.
- Permissions: use `requireAuth` + `requirePermission` from `shared/permissions.ts` on every protected route.

### 4. Backend Patterns
- All Express routes consolidated in large `server/routes.ts`; add domain-specific endpoints following existing Arabic naming/comment style.
- Validation: derive Zod schemas from Drizzle tables (`createInsertSchema`) then extend (e.g. positive quantities) – never handcraft types that drift.
- External services: see `server/services/` (notification-manager, ml-service, meta-whatsapp, data-validator). Reuse rather than duplicating logic.
- Storage & external APIs: `server/storage.ts` (GCS), OpenAI/Twilio integrations – keep secrets in env vars.

### 5. Frontend Patterns
- Data fetching: TanStack Query + backend JSON; wrap risky queries with `QueryErrorBoundary`.
- Forms: React Hook Form + Zod resolver; server errors return Arabic message strings.
- Protected navigation: wrap sensitive pages with `ProtectedRoute`.
- Keep domain modeling client‑light: leverage types imported from `@shared/schema`.

### 6. Migrations & Deployment
- Schema source of truth is Drizzle definitions; run `npm run db:push` for dev syncing.
- Production startup runs migrations automatically (`scripts/migrate.js` + logic in `server/index.ts`).
- Health check: `/api/health` (used in deployment monitors).
- Deployment guides: see `DEPLOYMENT_GUIDE.md` + `DEPLOYMENT-SOLUTIONS.md` for validated process & troubleshooting.

### 7. Essential Commands
```bash
npm run dev        # concurrent backend (tsx) + Vite frontend
npm run db:push    # apply schema changes (Drizzle → Neon)
npm run build      # production build (Vite + esbuild)
npm test           # data integrity + concurrency tests
```

### 8. Testing Focus
- `tests/data-integrity.test.ts` stresses concurrent operations / quantity & stock invariants – add cases here when changing production logic.
- Prefer simulation of multi-step workflows over isolated unit tests when touching order / roll logic.

### 9. Safe Change Checklist (قبل الدمج)
1. Schema change? Update Drizzle table + regenerate & push; never patch raw SQL manually.
2. Quantity or stock logic? Update validator + add/adjust test.
3. New route? Enforce permission + Arabic error messages.
4. Transaction? Use provided middleware – avoid ad‑hoc `db` calls across awaits.
5. UI strings? Provide Arabic primary + English fallback; ensure RTL styling unaffected.

### 10. Common Pitfalls To Avoid
- Creating new DB connections (always import `db`).
- Skipping transaction middleware for multi-table writes.
- Mixing CommonJS require with ESM imports.
- Returning English-only or raw technical errors to client.
- Bypassing Drizzle/Zod validation for inserts/updates.

### 11. Adding Features Quickly (Pattern Example)
1. Define/extend table in `shared/schema.ts`.
2. Generate Zod insert/update schema via Drizzle helpers, extend for business rules.
3. Add route in `server/routes.ts` with `requirePermission` + transaction wrapper.
4. Update frontend hook/query; handle errors with `QueryErrorBoundary`.
5. Add integrity test covering edge (e.g. over-allocation attempt).

### 12. When Unsure
Search existing patterns in `server/routes.ts` & `data-validator.ts` before introducing new abstractions. Maintain Arabic domain vocabulary consistently.

Keep changes minimal, typed, transactional, bilingual, and constraint-safe. اطبق القيود دائمًا.