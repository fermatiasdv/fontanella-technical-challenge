# Frontend Architecture Report
**Stack:** React 19 + TypeScript 6 + SASS · **Vite 8** · Law-firm management SPA  
**Analyzed:** April 2026

---

## 1. Diagnosis — Current Problems

### 1.1 Structural / Architectural

**No router exists.**  
`App.tsx` uses `new URLSearchParams(window.location.search).get('page')` with a ternary chain to switch pages. There is a `// TODO` comment acknowledging this. Without a router, deep-linking, back-navigation, code-splitting, lazy loading, and protected routes are all impossible.

**The API layer leaks types into the wrong layer.**  
`api/contact.ts` exports `ContactAPI`, `CreateContactDto`, `UpdateContactDto`, and `MethodType`. `api/workingSchedule.ts` exports `WorkingScheduleAPI` and `WorkingScheduleSlotDto`. `api/vacations.ts` exports `VacationAPI`. Meanwhile `types/` has `AppointmentAPI`, `LawyerAPI`, `ClientAPI`. There is no rule for where a type lives. Consumers must know whether to import from `api/X` or `types/X`, which is an invisible contract that breaks at scale.

**`SchedulerPage.tsx` is a God File (≈ 900 lines).**  
It contains constants, 8+ utility functions, 4 full sub-components (WeekNavigator, SlotFormModal, SlotDrawer, LawyerSelector), data fetching from 3 sources, and all the render logic. This is one file that should be at least 10 files.

**`LawyerManagementHome.tsx` contains multi-step orchestration business logic.**  
`handleCreateLawyer` and `handleEditLawyer` each perform 4-step async sequences: create lawyer → save contacts → save schedule → save vacations. This is domain-level business logic living directly in a page component. If this ever needs to be reused (e.g., an import wizard), it cannot be.

**`AppointmentFormModal.tsx` calls the API directly.**  
The component directly calls `contactApi`, `workingScheduleApi`, and `vacationsApi`. A UI component should never own network calls. This makes the component impossible to test in isolation and creates hidden coupling between the modal and the entire backend.

**`useAppointments` is a God Hook.**  
It fetches from 4 independent data sources: appointments, lawyers, clients, contacts — each with its own loading state. When the appointments screen grows, this hook becomes the sole choke point for all feature data. It also forces the same 4 fetches on every consumer, even when only one is needed.

**`useWorkingSchedule` conflates data fetching with UI selection state.**  
`selectedLawyerId` and `selectLawyer` are UI concerns — which lawyer the user picked in a dropdown. A data hook should not own that state. If another component needs to read `selectedLawyerId` without consuming the working schedule, it cannot.

**`TableSkeleton` and `ErrorBanner` are duplicated across pages.**  
Defined separately in `ClientsPage.tsx` and `LawyerManagementHome.tsx` with identical implementations. Two definitions means two places to update, two chances to drift.

**`PAGE_SIZE = 4` is duplicated.**  
Defined independently in both `ClientsPage.tsx` (line 12) and `useLawyers.ts` (line 17).

### 1.2 Import & Naming

**No absolute path aliases.**  
All imports are relative (`../../api/`, `../types/`). One folder restructure breaks every import across the project. This is also a readability problem: `../../components/common/ContactMethodsSection` tells you nothing about domain boundaries.

**No barrel exports.**  
There is no `index.ts` at any level, forcing consumers to know the exact internal file that owns a given export. Internal refactors (renaming a file) become cross-cutting changes.

**`LawyerManagementHome.tsx` is inconsistently named.**  
All other pages are named `XxxPage.tsx`. This one is `LawyerManagementHome.tsx`. It will always be the odd one out in the file tree.

**`api/client.ts` vs `api/clients.ts` naming collision.**  
`client.ts` is the HTTP base client (`apiFetch`). `clients.ts` is the client-entity API. Visually indistinguishable in any fuzzy file searcher.

### 1.3 Component Layer

**`AvailabilityPanel` is a data-fetching sub-component buried inside a modal.**  
`AppointmentFormModal.tsx` contains `AvailabilityPanel` which runs `useEffect` + `Promise.all` to fetch schedule and vacation data. A UI component should receive data as props; this makes it untestable without mocking the full API layer.

**Contact intersection logic lives inside a modal.**  
The logic to find the intersection of a lawyer's and a client's contact methods is a domain rule. It belongs in a service or a custom hook, not buried on line 306 of a modal file.

**UI-only types mixed with API types in `types/lawyer.ts`.**  
`ActiveContext` and `ScheduleConflict` are tagged as "UI-only" in comments but share the same file as backend response shapes. This signals that no rule governs type ownership.

---

## 2. Proposed Folder Structure

### Architecture choice: Feature-Based (Vertical Slice)

**Why not a classic layered architecture (`/components`, `/hooks`, `/services` at the root)?**

Layered architectures force you to jump across 4 folders to understand one feature. They also create no enforcement: a developer adding a lawyer component will not know whether to put it in `/components/lawyers` or `/components/shared`. Feature-based architecture co-locates everything a feature owns. Deleting a feature is deleting one folder. Onboarding a new developer means reading one folder to understand one domain.

The rule is: **if code serves exactly one feature, it lives inside that feature's folder. If it serves two or more features, it lives in `/shared`.**

```
src/
│
├── app/
│   ├── App.tsx                      # Root: layout shell only, renders <Router>
│   └── Router.tsx                   # Route definitions with React Router
│
├── pages/                           # Thin routing shells — NOTHING ELSE
│   ├── LawyersPage.tsx
│   ├── ClientsPage.tsx
│   ├── AppointmentsPage.tsx
│   └── SchedulerPage.tsx
│
├── features/
│   │
│   ├── lawyers/
│   │   ├── components/
│   │   │   ├── LawyerTable.tsx
│   │   │   ├── LawyerRow.tsx
│   │   │   ├── LawyersPageHeader.tsx
│   │   │   └── CreateLawyerModal.tsx
│   │   ├── hooks/
│   │   │   └── useLawyers.ts
│   │   ├── services/
│   │   │   └── lawyerService.ts     # Multi-step orchestration (create/edit flows)
│   │   ├── types/
│   │   │   └── lawyer.types.ts      # LawyerAPI, CreateLawyerDto, ScheduleSlotInput, VacationInput
│   │   └── index.ts                 # Public API of this feature (re-exports)
│   │
│   ├── clients/
│   │   ├── components/
│   │   │   ├── ClientTable.tsx
│   │   │   ├── ClientRow.tsx
│   │   │   ├── ClientsPageHeader.tsx
│   │   │   ├── ClientSearchBar.tsx
│   │   │   └── AddClientModal.tsx
│   │   ├── hooks/
│   │   │   └── useClients.ts
│   │   ├── services/
│   │   │   └── clientService.ts     # Orchestration (create client + contacts)
│   │   ├── types/
│   │   │   └── client.types.ts
│   │   └── index.ts
│   │
│   ├── appointments/
│   │   ├── components/
│   │   │   ├── AppointmentTable.tsx
│   │   │   ├── AppointmentRow.tsx
│   │   │   ├── AppointmentFormModal.tsx
│   │   │   └── AvailabilityPanel.tsx
│   │   ├── hooks/
│   │   │   ├── useAppointments.ts   # Fetches + mutates appointments only
│   │   │   └── useAppointmentForm.ts # Form state + contact intersection logic
│   │   ├── utils/
│   │   │   └── datetimeUtils.ts     # formatDatetime, toLocalInput, localInputToISO
│   │   ├── types/
│   │   │   └── appointment.types.ts
│   │   └── index.ts
│   │
│   └── scheduler/
│       ├── components/
│       │   ├── CalendarGrid.tsx
│       │   ├── WeekNavigator.tsx
│       │   ├── DayColumn.tsx
│       │   ├── AppointmentBlock.tsx
│       │   ├── SlotFormModal.tsx
│       │   ├── SlotDrawer.tsx
│       │   ├── LawyerSelector.tsx
│       │   └── AvailabilityPanel.tsx
│       ├── hooks/
│       │   ├── useScheduler.ts        # Composite: owns selectedLawyerId, composes below
│       │   ├── useWorkingSchedule.ts  # Data-only: receives lawyerId as param
│       │   └── useLawyerVacations.ts  # Data-only: receives lawyerId as param
│       ├── utils/
│       │   ├── calendarLayout.ts      # minToTopPx, minToHeightPx, HOUR_HEIGHT_PX, etc.
│       │   └── dateHelpers.ts         # getMondayOfWeek, getWeekDates, isSameDay, formatWeekLabel
│       ├── constants/
│       │   └── scheduler.constants.ts # DAYS_EN, DAYS_SHORT, MONTHS_ES, DAY_START_HOUR, etc.
│       ├── types/
│       │   └── scheduler.types.ts
│       └── index.ts
│
├── shared/
│   ├── components/
│   │   ├── ErrorBanner.tsx           # Used by lawyers + clients pages
│   │   ├── TableSkeleton.tsx         # Used by lawyers + clients pages
│   │   ├── Pagination.tsx            # Used by lawyers + clients features
│   │   └── ContactMethodsSection.tsx
│   ├── hooks/
│   │   ├── useLawyerList.ts          # Fetches all lawyers (reused by appts + scheduler)
│   │   └── useClientList.ts          # Fetches all clients (reused by appts + scheduler)
│   └── types/
│       └── common.types.ts           # MethodType, ContactAPI, shared interfaces
│
├── services/                         # Pure HTTP layer — NO business logic
│   ├── http.client.ts                # apiFetch + ApiError (renamed from api/client.ts)
│   ├── appointments.service.ts
│   ├── clients.service.ts
│   ├── contact.service.ts
│   ├── lawyers.service.ts
│   ├── vacations.service.ts
│   └── workingSchedule.service.ts
│
└── styles/                           # Unchanged — already well structured
    ├── _tokens.scss
    ├── _base.scss
    ├── _shared.scss
    ├── _animations.scss
    ├── components/
    │   └── ...
    └── main.scss
```

---

## 3. Architecture Rules (Non-Negotiable)

### 3.1 File Size

| File type | Hard limit |
|-----------|-----------|
| Page (`/pages`) | 50 lines |
| Feature hook | 150 lines |
| Feature service | 100 lines |
| Feature component | 200 lines |
| Shared component | 150 lines |
| Utility function file | 80 lines |

If a file exceeds its limit, it must be split — no exceptions. The current `SchedulerPage.tsx` (≈900 lines) would be split into at minimum 10 files under these rules.

### 3.2 What a Page Can and Cannot Do

**A page (`/pages/XxxPage.tsx`) is ONLY allowed to:**
- Import the feature root component.
- Pass route params/search params as props.
- Set the document title (optional).

**A page is NEVER allowed to:**
- Contain `useState` or `useEffect`.
- Import from `@/services` directly.
- Contain business logic, helper functions, or type definitions.
- Contain JSX beyond the layout wrapper and the feature root.

```tsx
// CORRECT — LawyersPage.tsx (this is the entire file)
import { LawyerManagement } from '@/features/lawyers';

export default function LawyersPage() {
  return <LawyerManagement />;
}
```

### 3.3 Where Business Logic Must Live

| Logic type | Where it lives |
|-----------|---------------|
| Multi-step async orchestration (create + side effects) | `features/xxx/services/xxxService.ts` |
| Data fetching + caching + optimistic updates | `features/xxx/hooks/useXxx.ts` |
| Form state + local validation | `features/xxx/hooks/useXxxForm.ts` |
| Pure calculations (no I/O, no React) | `features/xxx/utils/` |
| Cross-feature pure calculations | `shared/utils/` |

Business logic is **never** allowed in page files or component render functions.

### 3.4 Where Types Must Live

| Type category | Where it lives |
|--------------|---------------|
| Backend response shapes (`XxxAPI`) | `features/xxx/types/xxx.types.ts` |
| DTOs sent to the API | `features/xxx/types/xxx.types.ts` |
| UI-only state types local to a hook | Same file as the hook |
| Types used by 2+ features | `shared/types/common.types.ts` |
| HTTP infrastructure types | `services/http.client.ts` |

Types are **never** defined inside `services/` files. The current `api/contact.ts` pattern — where an API file also exports `ContactAPI` and `MethodType` — is explicitly forbidden.

### 3.5 Import Strategy

**Absolute path aliases are mandatory.** Configure in both `vite.config.ts` and `tsconfig.app.json`:

```ts
// vite.config.ts
import path from 'path';
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}

// tsconfig.app.json
"paths": { "@/*": ["./src/*"] }
```

**Layer import rules — a layer may only import from the layers below it:**

```
pages/          →  features/*, shared/*, app/
features/xxx/   →  services/*, shared/*, own feature only
shared/         →  services/
services/       →  nothing (only http.client.ts + native fetch)
```

Cross-feature imports are **forbidden**. `features/appointments` cannot import from `features/lawyers`. If shared data is needed, it flows through `shared/` or is passed as props.

**Relative imports are only allowed within the same folder.** Between folders, always use `@/`.

```ts
// FORBIDDEN
import { useLawyers } from '../../../hooks/useLawyers';

// CORRECT
import { useLawyers } from '@/features/lawyers';
```

### 3.6 Naming Conventions

| Artifact | Convention | Example |
|---------|-----------|---------|
| Component files | PascalCase | `LawyerRow.tsx` |
| Hook files | camelCase, `use` prefix | `useLawyers.ts` |
| Service files | camelCase, `.service` suffix | `lawyers.service.ts` |
| Feature orchestration | camelCase, no suffix | `lawyerService.ts` |
| Type files | camelCase, `.types` suffix | `lawyer.types.ts` |
| Utility files | camelCase | `calendarLayout.ts` |
| Constants files | camelCase, `.constants` suffix | `scheduler.constants.ts` |
| Page files | PascalCase, `Page` suffix | `LawyersPage.tsx` |
| Feature folders | lowercase plural | `lawyers/`, `clients/` |
| Barrel files | always `index.ts` | — |

### 3.7 Component Splitting Rules

A component must be extracted when any of the following is true:

1. It has its own data fetching logic (any `useEffect` that calls a service).
2. It renders a meaningful, independently nameable UI section.
3. It is rendered in more than one place.
4. Its JSX exceeds 80 lines.
5. It requires more than 5 props.

`AvailabilityPanel` inside `AppointmentFormModal` violates rules 1 and 4 simultaneously — it must be its own file.

### 3.8 The Service Layer Contract

A file inside `services/` may only contain:
- `async` functions that call `apiFetch`.
- Type imports from `@/features/*/types` or `@/shared/types`.

A service file may never:
- Call `useState`, `useEffect`, or any React hook.
- Contain business logic or orchestration across multiple API calls.
- Export types (types belong in `types/` files).

Multi-step orchestration (create lawyer → contacts → schedule → vacations) belongs in `features/lawyers/services/lawyerService.ts`, not in the HTTP service.

---

## 4. Refactor Strategy

### Phase 0 — Foundation (no feature work yet)

**Step 1: Add React Router.**  
Install `react-router-dom`. Create `src/app/Router.tsx` with 4 routes. The current URLSearchParams hack is a 3-line removal. This unblocks code-splitting later.

**Step 2: Configure absolute path alias.**  
Add `@` alias to `vite.config.ts` and `tsconfig.app.json`. Zero behavior change, but every subsequent file benefits from clean imports.

**Step 3: Extract shared components.**  
Extract `ErrorBanner` and `TableSkeleton` (currently duplicated in `ClientsPage.tsx` and `LawyerManagementHome.tsx`) into `src/shared/components/`. Delete both duplicates. Safe, isolated change — no logic, only JSX.

**Step 4: Create `services/http.client.ts`.**  
Copy `api/client.ts` → `services/http.client.ts`. Update the 6 API module files to import from the new path. Delete `api/client.ts`. Zero behavior change.

### Phase 1 — Lawyers Feature (pilot — establishes the pattern)

Start with lawyers because it is the most complex feature. Establishing the right pattern here prevents repeating mistakes across subsequent features.

**Step 5:** Move all types from `types/lawyer.ts` → `features/lawyers/types/lawyer.types.ts`. Update all imports. Delete `types/lawyer.ts`.

**Step 6:** Migrate `api/lawyers.ts` → `services/lawyers.service.ts`. Pure path fix. Update all imports.

**Step 7:** Extract multi-step orchestration into `features/lawyers/services/lawyerService.ts`. The `handleCreateLawyer` and `handleEditLawyer` functions currently living in `LawyerManagementHome.tsx` move here as `createLawyerWithDetails` and `updateLawyerWithDetails`. The page will call these service functions instead.

**Step 8:** Migrate `hooks/useLawyers.ts` → `features/lawyers/hooks/useLawyers.ts`. The hook calls `lawyers.service.ts` for HTTP, not the API directly.

**Step 9:** Move `components/lawyers/*` → `features/lawyers/components/`. Fix imports.

**Step 10:** Create thin `pages/LawyersPage.tsx`. The existing `LawyerManagementHome.tsx` is renamed `features/lawyers/components/LawyerManagement.tsx` and becomes the feature root.

**Step 11:** Create `features/lawyers/index.ts` barrel. Export: `LawyerManagement`, `LawyerAPI`, `CreateLawyerDto`.

### Phase 2 — Clients Feature

Same pattern as lawyers. Simpler because there is no multi-step schedule/vacation complexity.

**Step 12:** `types/client.ts` → `features/clients/types/client.types.ts`  
**Step 13:** `api/clients.ts` → `services/clients.service.ts`  
**Step 14:** Extract `handleCreateClient` → `features/clients/services/clientService.ts`  
**Step 15:** `hooks/useClients.ts` → `features/clients/hooks/useClients.ts`  
**Step 16:** `components/clients/*` → `features/clients/components/`  
**Step 17:** Thin `pages/ClientsPage.tsx`

### Phase 3 — Appointments Feature

**Step 18:** Move types → `features/appointments/types/`.

**Step 19:** Split `useAppointments` into dedicated hooks:
- `features/appointments/hooks/useAppointments.ts` — appointments CRUD only.
- `shared/hooks/useLawyerList.ts` — fetches lawyers list (reused by scheduler too).
- `shared/hooks/useClientList.ts` — fetches clients list (reused by scheduler too).

**Step 20:** Extract `useAppointmentForm.ts` — owns form state and the contact intersection logic currently buried in `AppointmentFormModal` around line 306.

**Step 21:** Extract `AvailabilityPanel` into its own file `features/appointments/components/AvailabilityPanel.tsx`. It receives `lawyerId` as a prop and fetches internally, cleanly separated.

**Step 22:** The slimmed `AppointmentFormModal` no longer calls any API service directly.

### Phase 4 — Scheduler Feature (most complex)

**Step 23:** Extract constants → `features/scheduler/constants/scheduler.constants.ts`. This alone removes ~25 lines from the page file.

**Step 24:** Extract utilities:
- `getMondayOfWeek`, `getWeekDates`, `isSameDay`, `formatWeekLabel` → `features/scheduler/utils/dateHelpers.ts`
- `timeToMin`, `minToTimeStr`, `minToTopPx`, `minToHeightPx`, `formatDisplayTime` → `features/scheduler/utils/calendarLayout.ts`
- `contactMethodIcon`, `contactMethodLabel` → `shared/utils/contactMethod.utils.ts` (also used by `AppointmentFormModal`)

**Step 25:** Extract sub-components from `SchedulerPage.tsx`:
- `WeekNavigator` → `features/scheduler/components/WeekNavigator.tsx`
- `SlotFormModal` → `features/scheduler/components/SlotFormModal.tsx`
- `SlotDrawer` → `features/scheduler/components/SlotDrawer.tsx`
- `LawyerSelector` → `features/scheduler/components/LawyerSelector.tsx`
- Calendar day column rendering → `features/scheduler/components/DayColumn.tsx`
- Appointment block rendering → `features/scheduler/components/AppointmentBlock.tsx`

**Step 26:** Split `useWorkingSchedule`:
- `features/scheduler/hooks/useWorkingSchedule.ts` — data-only hook, receives `lawyerId: number` as a parameter. No selection state.
- `features/scheduler/hooks/useScheduler.ts` — composite hook, owns `selectedLawyerId`, composes `useWorkingSchedule` + `useLawyerVacations` + `shared/hooks/useLawyerList`.

**Step 27:** Thin `pages/SchedulerPage.tsx` — 10 lines.

### Phase 5 — Cleanup

**Step 28:** Delete `src/api/` (now empty).  
**Step 29:** Delete `src/types/` (now empty).  
**Step 30:** Delete `src/hooks/` (now empty).  
**Step 31:** Move `lib/lawyerUtils.ts` → `features/lawyers/utils/lawyerUtils.ts`. Delete `src/lib/`.

### Commit Strategy

Each numbered step above is a single commit:

```
refactor(foundation): add react-router-dom with 4 routes
refactor(foundation): configure @/ absolute path alias
refactor(shared): extract ErrorBanner and TableSkeleton to shared/components
refactor(lawyers): move types to features/lawyers/types
refactor(lawyers): extract orchestration into lawyerService
refactor(lawyers): migrate useLawyers hook to features/lawyers/hooks
refactor(appointments): split useAppointments into focused hooks
```

**Never mix refactoring and feature changes in the same commit.** If a bug fix is needed during migration, commit the fix separately first on the old path, then migrate. This keeps git bisect safe and PRs reviewable.

---

## 5. Example Refactor — AppointmentsPage

### BEFORE

**`src/pages/AppointmentsPage.tsx` — 225 lines**

**All the responsibilities it currently carries:**

1. Fetches appointments (via `useAppointments`).
2. Fetches lawyers list (via `useAppointments` — same hook).
3. Fetches clients list (via `useAppointments` — same hook).
4. Fetches contacts list (via `useAppointments` — same hook).
5. Owns modal open/close state.
6. Owns the "edit target" appointment state.
7. Computes `lawyerMap` and `clientMap` lookup callbacks.
8. Handles the save flow (create vs update branching via `editAppointment` check).
9. Contains `AppointmentRow` sub-component definition with its own `deleting` state.
10. Contains `AppointmentRowProps` interface definition.
11. Contains `formatDatetime` helper function.
12. Renders table header, empty state, loading state, error state.
13. Renders `AppointmentFormModal` with 8 props.

That is 13 distinct responsibilities in one 225-line file.

---

### AFTER

**Files produced from those 13 responsibilities:**

```
features/appointments/
  components/
    AppointmentRow.tsx          ← #9, #10 — sub-component + its props
    AppointmentTable.tsx        ← #12 — table wrapper (header, empty, loading)
    AppointmentsPageHeader.tsx  ← section title + "New Appointment" button
    AppointmentFormModal.tsx    ← #13 — modal (cleaned, no API calls)
    AvailabilityPanel.tsx       ← extracted sub-component from modal
  hooks/
    useAppointments.ts          ← #1 — appointments CRUD only
    useAppointmentForm.ts       ← #8, contact intersection logic
  utils/
    datetimeUtils.ts            ← #11 — formatDatetime, toLocalInput, localInputToISO

shared/hooks/
  useLawyerList.ts              ← #2 — fetches lawyers, reusable
  useClientList.ts              ← #3 — fetches clients, reusable

pages/
  AppointmentsPage.tsx          ← 8 lines total
```

---

**`pages/AppointmentsPage.tsx` — AFTER (complete file)**

```tsx
import { AppointmentManagement } from '@/features/appointments';

export default function AppointmentsPage() {
  return <AppointmentManagement />;
}
```

---

**`features/appointments/hooks/useAppointments.ts` — AFTER**

```ts
import { useState, useEffect, useCallback } from 'react';
import { appointmentsService } from '@/services/appointments.service';
import type {
  AppointmentAPI,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from '@/features/appointments/types/appointment.types';

export function useAppointments() {
  const [appointments, setAppointments] = useState<AppointmentAPI[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [fetchKey, setFetchKey]         = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    appointmentsService
      .list(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setAppointments(data); })
      .catch((err: Error) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  const create = useCallback(async (dto: CreateAppointmentDto): Promise<AppointmentAPI> => {
    const created = await appointmentsService.create(dto);
    setAppointments((prev) =>
      [...prev, created].sort(
        (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime(),
      ),
    );
    return created;
  }, []);

  const update = useCallback(async (id: number, dto: UpdateAppointmentDto) => {
    const updated = await appointmentsService.update(id, dto);
    setAppointments((prev) => prev.map((a) => (a.id_appointment === id ? updated : a)));
  }, []);

  const remove = useCallback(async (id: number) => {
    await appointmentsService.remove(id);
    setAppointments((prev) => prev.filter((a) => a.id_appointment !== id));
  }, []);

  return { appointments, loading, error, refetch, create, update, remove };
}
```

This hook no longer fetches lawyers, clients, or contacts. Each of those comes from its own dedicated hook, consumed separately where needed.

---

**`shared/hooks/useLawyerList.ts` — NEW (reusable across features)**

```ts
import { useState, useEffect } from 'react';
import { lawyersService } from '@/services/lawyers.service';
import type { LawyerAPI } from '@/features/lawyers/types/lawyer.types';

export function useLawyerList() {
  const [lawyers, setLawyers] = useState<LawyerAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    lawyersService
      .list(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setLawyers(data); })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return { lawyers, loading };
}
```

The same hook is consumed by the appointments form, the scheduler lawyer picker, and any future screen that needs a lawyer list — no duplication.

---

**`features/appointments/hooks/useAppointmentForm.ts` — NEW**

The contact intersection logic extracted from `AppointmentFormModal`:

```ts
import { useState, useEffect, useMemo } from 'react';
import { contactService } from '@/services/contact.service';
import type { ContactAPI, MethodType } from '@/shared/types/common.types';

interface Options {
  isOpen:   boolean;
  lawyerId: number | '';
  clientId: number | '';
}

interface CommonMethod {
  methodType:    MethodType;
  lawyerContact: ContactAPI;
}

export function useAppointmentForm({ isOpen, lawyerId, clientId }: Options) {
  const [lawyerContacts,    setLawyerContacts]    = useState<ContactAPI[]>([]);
  const [clientContacts,    setClientContacts]    = useState<ContactAPI[]>([]);
  const [contactsLoading,   setContactsLoading]   = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | ''>('');

  useEffect(() => {
    if (!isOpen || lawyerId === '' || clientId === '') {
      setLawyerContacts([]);
      setClientContacts([]);
      setSelectedContactId('');
      return;
    }
    const controller = new AbortController();
    setContactsLoading(true);
    Promise.all([
      contactService.listByLawyer(Number(lawyerId), controller.signal),
      contactService.listByClient(Number(clientId), controller.signal),
    ])
      .then(([lc, cc]) => {
        if (controller.signal.aborted) return;
        setLawyerContacts(lc);
        setClientContacts(cc);
        const common = resolveCommonContacts(lc, cc);
        setSelectedContactId(common[0]?.lawyerContact.id_contact ?? '');
      })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setContactsLoading(false); });
    return () => controller.abort();
  }, [isOpen, lawyerId, clientId]);

  const commonMethods = useMemo<CommonMethod[]>(
    () => resolveCommonContacts(lawyerContacts, clientContacts),
    [lawyerContacts, clientContacts],
  );

  return { commonMethods, contactsLoading, selectedContactId, setSelectedContactId };
}

// Pure domain function — testable with no mocks
function resolveCommonContacts(
  lawyerContacts: ContactAPI[],
  clientContacts: ContactAPI[],
): CommonMethod[] {
  const lawyerByMethod = new Map(lawyerContacts.map((c) => [c.method_type, c]));
  return clientContacts
    .filter((c) => lawyerByMethod.has(c.method_type))
    .map((c) => ({
      methodType:    c.method_type as MethodType,
      lawyerContact: lawyerByMethod.get(c.method_type)!,
    }));
}
```

---

**`features/appointments/components/AppointmentRow.tsx` — AFTER**

```tsx
import { useState } from 'react';
import type { AppointmentAPI } from '@/features/appointments/types/appointment.types';
import { formatDatetime } from '@/features/appointments/utils/datetimeUtils';

export interface AppointmentRowProps {
  appointment: AppointmentAPI;
  lawyerName:  string;
  clientName:  string;
  onEdit:      (a: AppointmentAPI) => void;
  onDelete:    (id: number) => Promise<void>;
}

export function AppointmentRow({
  appointment,
  lawyerName,
  clientName,
  onEdit,
  onDelete,
}: AppointmentRowProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete appointment "${appointment.subject}"?`)) return;
    setDeleting(true);
    try {
      await onDelete(appointment.id_appointment);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <tr className="appt-row">
      <td className="appt-row__cell">
        <p className="appt-row__subject">{appointment.subject}</p>
        {appointment.description && (
          <p className="appt-row__desc">{appointment.description}</p>
        )}
      </td>
      <td className="appt-row__cell">
        <div className="appt-row__person appt-row__person--lawyer">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
          <span>{lawyerName}</span>
        </div>
      </td>
      <td className="appt-row__cell">
        <div className="appt-row__person appt-row__person--client">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>business</span>
          <span>{clientName}</span>
        </div>
      </td>
      <td className="appt-row__cell">
        <span className="appt-row__datetime">{formatDatetime(appointment.start_datetime)}</span>
      </td>
      <td className="appt-row__cell">
        <span className="appt-row__datetime">{formatDatetime(appointment.end_datetime)}</span>
      </td>
      <td className="appt-row__cell">
        <div className="appt-row__actions">
          <button onClick={() => onEdit(appointment)} className="appt-row__btn appt-row__btn--edit" title="Edit">
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button onClick={handleDelete} disabled={deleting} className="appt-row__btn appt-row__btn--delete" title="Delete">
            {deleting
              ? <span className="material-symbols-outlined anim-spin">progress_activity</span>
              : <span className="material-symbols-outlined">delete</span>}
          </button>
        </div>
      </td>
    </tr>
  );
}
```

The interface that was anonymously embedded in the page file now lives co-located with the component that owns it, named and exported.

---

**`features/appointments/services/lawyerService.ts` — example for the lawyers orchestration**

```ts
import { lawyersService } from '@/services/lawyers.service';
import { contactService }  from '@/services/contact.service';
import { workingScheduleService } from '@/services/workingSchedule.service';
import { vacationsService } from '@/services/vacations.service';
import type { CreateLawyerDto, ScheduleSlotInput, VacationInput } from '@/features/lawyers/types/lawyer.types';
import type { ContactMethodInputI } from '@/shared/types/common.types';

export async function createLawyerWithDetails(
  dto:       CreateLawyerDto,
  contacts:  ContactMethodInputI[],
  schedule:  ScheduleSlotInput[],
  vacations: VacationInput[],
) {
  const created = await lawyersService.create(dto);
  const id = created.id_lawyer;

  if (contacts.length > 0) {
    await Promise.all(
      contacts.map((c, idx) =>
        contactService.create({ idLawyer: id, methodType: c.method_type, value: c.value, isDefault: idx === 0 }),
      ),
    );
  }

  if (schedule.length > 0) {
    await workingScheduleService.upsertSlots(id, schedule);
  }

  if (vacations.length > 0) {
    await Promise.all(
      vacations.map((v) => vacationsService.add(id, { startDate: v.startDate, endDate: v.endDate })),
    );
  }

  return created;
}
```

This is pure async orchestration. No React. No JSX. Fully testable with mocked service calls. The page that used to own this code is now 8 lines.

---

## 6. Anti-Patterns to Avoid

**Components that call the API directly.**  
`AppointmentFormModal` calls `contactApi.listByLawyer()` and `vacationsApi.getByLawyer()`. Components are for rendering. Fetching belongs in hooks. Hooks call services. Services call the HTTP client.

**Page files with business logic.**  
`LawyerManagementHome.tsx` contains `handleCreateLawyer` — a 30-line async function orchestrating 4 API calls. No page file should contain this. A page file that requires scrolling to understand is already too large.

**God hooks that fetch everything for a screen.**  
`useAppointments` returning `appointments + lawyers + clients + contacts` means every consumer pays the cost of all 4 fetches. Split by concern. Compose at the consumer level.

**Types defined inside API service files.**  
`api/contact.ts` exports `ContactAPI`, `MethodType`, and `CreateContactDto`. A service file is for HTTP calls. Types belong in `types/` files. When you want to find the shape of `ContactAPI`, you should look in `types/`, not in `api/`.

**Relative imports crossing feature boundaries.**  
`SchedulerPage.tsx` does `import { AppointmentFormModal } from '../components/appointments/AppointmentFormModal'`. This crosses a feature boundary with a relative path. Use `@/features/appointments` instead. The day either folder moves, the relative import fails silently.

**Duplicated micro-components defined locally in page files.**  
`TableSkeleton` and `ErrorBanner` are defined twice, identically, in separate page files. The next developer adding a third page will either duplicate them again or not find them at all.

**Constants and configuration duplicated across files.**  
`PAGE_SIZE = 4` lives in both `ClientsPage.tsx` and `useLawyers.ts`. If the product changes the page size, one will be updated and the other will not. Constants belong in one place.

**UI selection state inside data hooks.**  
`useWorkingSchedule` stores `selectedLawyerId` inside a data hook. A second component that needs to know the selected lawyer without triggering the schedule fetch cannot use this hook safely. Separate UI state from data fetching.

**Data-fetching sub-components embedded in parent files.**  
`AvailabilityPanel` runs 2 `useEffect` calls and a `Promise.all` inside `AppointmentFormModal.tsx`. It is completely invisible in the file tree. Developers searching for availability-related logic will not find it without knowing exactly where to look.

**A SPA without a router.**  
Every architectural decision made without React Router will need to be revisited when one is added. The URL hack in `App.tsx` blocks code-splitting, history management, and any kind of protected routing. This is Phase 0 — do it before any feature work.

---

## Quick Reference Card

```
QUESTION                                ANSWER
────────────────────────────────────────────────────────────────────────────
Where does a new component go?          features/[domain]/components/
                                        shared/components/ if used by 2+ features
Where does a new type go?              features/[domain]/types/[domain].types.ts
                                        shared/types/common.types.ts if cross-feature
Where does an API call go?             services/[domain].service.ts
Where does business orchestration go?  features/[domain]/services/[domain]Service.ts
Where does form state go?              features/[domain]/hooks/use[Domain]Form.ts
Where does a pure function go?         features/[domain]/utils/ or shared/utils/
What can a page file contain?          One JSX element and nothing else.
Can I import across features?          No. Use shared/ or pass as props.
Max lines per page file?               50
Max lines per hook?                    150
Max lines per component?               200
```
