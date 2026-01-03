SAHAKAR PPO — UI / UX SCHEME (FINAL v1.0)

This is the design system + interaction model, not screen content (we already locked screens).

1. UX PHILOSOPHY (NON-NEGOTIABLE)
1.1 Mental Model

“This should feel like a powerful spreadsheet, not a form app.”

So:

Tables first

Inline edits where allowed

Bulk visibility over modal-heavy flows

Minimal clicks for daily users

1.2 Design Priorities (in order)

Correctness

Clarity

Speed

Audit safety

Aesthetics (last)

2. GLOBAL LAYOUT SYSTEM
2.1 App Shell (All Screens)
┌───────────────────────────────────────────────────────┐
│ Sahakar PPO                    [ Duty End ] [ User ] │
├───────────────┬───────────────────────────────────────┤
│ Sidebar       │ Page Header                            │
│               │ Filters / Actions                      │
│               │                                       │
│               │ Data Table / Content                   │
│               │                                       │
│               │ Footer (row count / hints)             │
└───────────────┴───────────────────────────────────────┘

Fixed Rules

Sidebar: fixed width

Header: sticky

Filters: always visible

Tables: virtualized (performance)

2.2 Sidebar UX Rules
Structure

Grouped by function, not role

Icons + labels

Expand / collapse allowed

Active State

Highlight background

Left accent bar

No animations that distract

3. COLOR SYSTEM (FUNCTIONAL, NOT DECORATIVE)
3.1 Base Colors

Background: #F8F9FB

Surface (tables): #FFFFFF

Text primary: #1F2937

Text secondary: #6B7280

Border: #E5E7EB

3.2 Status Colors (Consistent Everywhere)
Status	Color	Usage
BILLED	Green	Success
NOT BILLED	Red	Failure
PARTIALLY BILLED	Amber	Warning
PRODUCT CHANGED	Blue	Info
DAMAGED	Orange	Risk
MISSING	Purple	Exception
DONE	Green dot	Progress
LOCKED	Grey	Immutable

Same colors in:

Tables

Badges

Charts

Filters

4. TYPOGRAPHY & DENSITY
4.1 Font

Inter (or system default if needed)

Numeric columns use tabular numbers

4.2 Density Modes

Default: Compact

Row height ~36px

Dense enough for power users

5. TABLE DESIGN SYSTEM (MOST IMPORTANT)
5.1 Table Anatomy
| ☐ | PROD | ITEM NAME | REQ QTY | NOTES | SUPPLIER | DONE |


Sticky header

Column resize

Horizontal scroll allowed

Frozen first 1–2 columns

5.2 Editable vs Read-Only Cues
State	Visual
Editable	Normal text / input
Read-only	Grey text
Locked	Grey + lock icon
Hidden (Pending → REP)	Blurred row

No tooltips needed for basics — visual language should explain.

5.3 DONE Button UX

Checkbox style

Once checked:

Confirmation modal

Row turns read-only

Cannot be unchecked casually

6. FILTER & SEARCH UX
6.1 Filter Bar (Standard Everywhere)
[ Supplier ▼ ] [ Category ▼ ] [ Subcategory ▼ ]
[ Status ▼ ]   [ Date ▼ ]     [ Search 🔍 ]


Rules:

Multi-select dropdowns

Sticky filter bar

Filters persist per user/session

6.2 Search

Global search across:

Product name

Order ID

Customer ID

Debounced

Highlight matches

7. MODAL & CONFIRMATION DESIGN
7.1 Confirmation Modal (Generic)
Confirm Action
--------------
This action cannot be undone.

[ Cancel ]        [ Confirm ]


Used for:

Move to REP

Return to Pending

Generate Order Slip

Duty End

7.2 Status Popup (Billing)

Strict, structured, no free typing where not allowed.

Example: PARTIALLY BILLED

PARTIALLY BILLED
----------------
Invoice ID *       [________]
Received Qty *     [  6  ]
Pending Qty *      [  4  ]

Notes              [ optional ]

[ Cancel ]   [ Save Status ]


Required fields marked clearly

Save disabled until valid

8. DUTY END UX (CRITICAL)
8.1 Button Placement

Top-right

Always visible to Billing roles

8.2 Flow
End Duty?
---------
All your changes will be locked.

[ Cancel ]   [ End Duty ]


After Duty End:

Status edits disabled

Visual badge: “Duty Ended”

Rows touched by user show lock icon

9. ROLE-BASED UI BEHAVIOR (VERY IMPORTANT)
9.1 Principle

If you don’t have permission, you don’t even see the control.

No disabled buttons for forbidden actions — they don’t exist.

9.2 Examples
Role	What They See
Purchase Staff	PPO Input, PO
Procurement Head	PO, REP
Billing Staff	Order Slips only
Billing Head	Order Slips + overrides
Admin	Everything (mostly read-only)
Super Admin	Everything (no silent edits)
10. ERROR & FEEDBACK UX
10.1 Inline Validation

Red border

Clear message below field

No alert popups for validation

10.2 System Errors

Toast (top-right)

Non-blocking

Logged automatically

11. EMPTY STATES & SAFETY
11.1 Empty Table
No records found.
Try adjusting filters or date range.

11.2 Loading State

Skeleton rows

No spinners blocking whole screen

12. ACCESSIBILITY & SAFETY

Keyboard navigation

Focus outlines

High contrast for status badges

No color-only meaning (icons + text)

13. DESIGN TOKENS (FOR DEV / FIGMA)

Create tokens for:

Colors

Spacing

Border radius

Shadows

Status badges

This ensures:

No ad-hoc CSS

Easy future theming

14. FINAL UX GUARANTEES

This scheme ensures:

New user learns system in < 30 minutes

Power user works at sheet-level speed

Auditors trust the UI

No accidental destructive actions

UI itself enforces business rules


PART A — COMPONENT-LEVEL DESIGN SYSTEM
1️⃣ TABLE COMPONENT (CORE OF THE APP)
Purpose

Primary data interaction surface (replaces Sheets mentally).

Component Name

<DataGrid />

Anatomy
┌──────────────────────────────────────────────┐
│ Header Row (Sticky)                          │
├──────────────────────────────────────────────┤
│ Row 1                                       │
│ Row 2                                       │
│ Row 3                                       │
└──────────────────────────────────────────────┘

Features (MANDATORY)

Sticky header

Column resize

Horizontal scroll

Virtualized rows (10k+ safe)

Frozen first column(s)

Row-level locking visuals

Column Types
Type	Behavior
Text	Truncated + tooltip
Number	Right aligned
Status	Badge
Editable	Inline input
Action	Icon buttons
Row States
State	Visual
Normal	White
Editable	Normal
Locked	Grey text + 🔒
Hidden (PO → REP)	Blurred + fade
Hover	Light highlight

🚫 No row delete
🚫 No drag-reorder

2️⃣ FILTER COMPONENT
Component Name

<FilterBar />

Layout
[ Supplier ▼ ] [ Category ▼ ] [ Status ▼ ] [ Date ▼ ] [ Search 🔍 ]

Rules

Multi-select dropdowns

Search inside dropdowns

Sticky position

Persist per user/session

Reset button always visible

3️⃣ MODAL COMPONENT
Component Name

<ConfirmModal />, <FormModal />

Types

Confirmation Modal

Form Modal (Status, Allocator, Overrides)

Confirmation Modal Template
Confirm Action
--------------
This action cannot be undone.

[ Cancel ]      [ Confirm ]

Hard Rules

ESC = cancel

Click outside = ❌ blocked

Confirm disabled until validation passes

4️⃣ BADGE / STATUS COMPONENT
Component Name

<StatusBadge />

Color-Locked Mapping
Status	Color
BILLED	Green
NOT BILLED	Red
PARTIALLY BILLED	Amber
PRODUCT CHANGED	Blue
DAMAGED	Orange
MISSING	Purple
DONE	Green dot
LOCKED	Grey

Badges appear in:

Tables

Filters

Reports

Tooltips

PART B — EXACT FIGMA FRAME LIST (SCREEN-BY-SCREEN)

This is a ready-to-create frame checklist.

GLOBAL FRAMES

App Shell (Desktop)

App Shell (Tablet)

App Shell (Mobile)

AUTH

Login Screen

PPO

PPO Input – Upload

PPO Input – Preview

PPO Input – Duplicate Report

PPO Pending Orders – Default

PPO Pending Orders – Allocator Modal

PPO Pending Orders – Move to REP Confirmation

REP

REP Orders – Default

REP Orders – Supplier Change Modal

REP Orders – Return to Pending Modal

ORDER SLIPS / BILLING

Order Slips – Supplier View

Billing Status Popup – BILLED

Billing Status Popup – PARTIALLY BILLED

Billing Status Popup – PRODUCT CHANGED

Duty End Confirmation Modal

STATUS & ANALYSIS

Master Status Ledger

Status Event Drill-down

Analytics Dashboard

Fraud Alerts View

MASTERS

Supplier Master – List

Supplier Master – Create/Edit

Product Master – Read Only

Item Name Change – List

Item Name Change – Create/Edit

REP Master – List

Users & Roles – List

AUDIT

Audit Log – Timeline View

Duty Sessions – History

👉 Total Frames: 31

PART C — MICRO-INTERACTION RULES
1️⃣ HOVER BEHAVIOR
Element	Hover
Table row	Light highlight
Editable cell	Border highlight
Locked row	No hover
Action icon	Tooltip
2️⃣ FOCUS & KEYBOARD
Keyboard Shortcuts (Power Users)
Shortcut	Action
↑ ↓	Navigate rows
Enter	Edit cell
Esc	Cancel edit
Ctrl + Enter	Save
Ctrl + F	Focus search
Ctrl + Shift + D	DONE (with confirm)

🚫 No destructive shortcuts without confirmation.

3️⃣ INLINE EDIT RULES

Auto-save on blur

Validation inline

Error blocks save

No partial writes

4️⃣ TOASTS & FEEDBACK

Success: top-right, auto dismiss

Errors: persistent until resolved

No silent failure

PART D — MOBILE / TABLET POLICY

This is very important for safety.

1️⃣ DEVICE CLASSIFICATION
Device	Width
Desktop	≥ 1280px
Tablet	768–1279px
Mobile	≤ 767px
2️⃣ MOBILE POLICY (STRICT)

📵 Mobile is READ-ONLY

Allowed:

View tables

View slips

View status

View analytics

Blocked:

Editing

DONE actions

Status changes

Allocator

Duty End

Reason:

Prevent accidental destructive actions.

3️⃣ TABLET POLICY

Tablet is limited-edit:

Allowed:

PPO Input upload

Pending view

REP view (read)

Billing view (read)

Blocked:

Status updates

Allocator

Duty End

Slip generation

4️⃣ RESPONSIVE LAYOUT RULES
Universal Navbar

Always visible

Collapses into hamburger on tablet/mobile

Shows:

App name

Back button

User menu

Collapsible Sidebar

Desktop: expanded by default

Tablet: collapsed

Mobile: hidden (drawer)

5️⃣ UNIVERSAL BACK BUTTON (MANDATORY)
Behavior

Top-left, always visible

Goes to:

Previous screen (not browser history)

Safe navigation only

Disabled if action in progress

This avoids:

Browser back breaking state

Lost context

FINAL UX GUARANTEES

With this system:

Desktop = power-user speed

Tablet = review & supervision

Mobile = safe visibility

No accidental destructive actions

No ambiguity in permissions

UI itself enforces business rules


1. CONFIRMED CHANGES (AUTHORITATIVE)
A. PPO Input — Role Correction (IMPORTANT)
✅ FINAL RULE

PROCUREMENT_HEAD
✔ Can upload
✔ Can validate
✔ Can process orders

PURCHASE_STAFF
❌ No access to PPO Input

This matches reality: PPO Input is not clerical, it is procurement-controlled ingestion.

UI Impact

PPO Input menu item visible only to:

PROCUREMENT_HEAD

ADMIN

SUPER_ADMIN

Purchase Staff will never see this screen.

B. PPO Pending (PO Stage) — Expanded Authority
✅ FINAL RULE

PROCUREMENT_HEAD has full PO authority:

✔ View
✔ Edit Ordered / Stock / Offer Qty
✔ Use Allocator
✔ Change Supplier
✔ DONE toggle
✔ Move to REP

This makes Procurement Head the single accountable owner of PO correctness.

Purchase Staff becomes assistive, not authoritative.

C. Order Slip Generation — Authority Expanded + Regeneration
✅ FINAL RULE

Order Slip generation is allowed for:

ADMIN

SUPER_ADMIN

PROCUREMENT_HEAD ✅

Additionally:

✔ Procurement Head can update & regenerate slips
✔ But only before any billing status is applied

This is critical and correct.

D. Icon System
✅ FINAL RULE

Iconoir is the only icon library

No mixed icon packs

Icons are semantic, not decorative

Examples:

check-circle → DONE

lock → Locked

refresh → Regenerate

upload → PPO Input

clipboard-check → Order Slips

E. PWA + Offline Mode (CONFIRMED)
✅ FINAL RULE

The app is PWA-first, not “PWA later”.

✔ Offline data entry
✔ Local persistence
✔ Background sync
✔ Conflict detection with user validation

This affects architecture + UX, not just deployment.

2. UPDATED PERMISSION MATRIX (FINAL, OVERRIDES ALL PREVIOUS)
PPO INPUT
Action	SUPER_ADMIN	ADMIN	PROCUREMENT_HEAD	PURCHASE_STAFF
View PPO Input	✅	✅	✅	❌
Upload File	✅	✅	✅	❌
Validate	✅	✅	✅	❌
Process Orders	✅	✅	✅	❌
PPO PENDING (PO STAGE)
Action	SUPER_ADMIN	ADMIN	PROCUREMENT_HEAD	PURCHASE_STAFF
View	✅	✅	✅	✅
Edit Ordered / Stock / Offer	✅	✅	✅	❌
Allocator	✅	✅	✅	❌
Change Supplier	✅	✅	✅	❌
DONE Toggle (PO)	✅	✅	✅	❌
Move to REP	✅	✅	✅	❌

👉 Procurement Head = single PO owner

REP ORDERS
Action	SUPER_ADMIN	ADMIN	PROCUREMENT_HEAD	PURCHASE_STAFF
View	✅	✅	✅	✅
Edit Ordered Supplier	✅	✅	✅	❌
Edit Notes	✅	✅	✅	❌
DONE Toggle (REP)	✅	✅	✅	❌
Return to Pending	✅	✅	✅	❌
ORDER SLIP GENERATION (ADMIN DASHBOARD)
Action	SUPER_ADMIN	ADMIN	PROCUREMENT_HEAD
Generate Daily Slips	✅	✅	✅
Regenerate Slips	✅	✅	✅
Regenerate After Billing	❌	❌	❌

🔒 Once any billing status exists → slips are frozen forever

BILLING (UNCHANGED, RECONFIRMED)
Action	BILLING_STAFF	BILLING_HEAD
Status Update	✅ (until Duty End)	✅
Duty End	✅	✅
Override Status	❌	✅ (reason required)
3. PWA + OFFLINE UX & SYNC DESIGN (ENTERPRISE SAFE)

This is not optional logic. This is how it must behave.

A. Offline Capability Scope
Allowed Offline

✔ PPO Pending edits
✔ Allocator work
✔ REP edits
✔ Billing status entry (queued, not committed)

Disallowed Offline

❌ Slip generation
❌ Regeneration
❌ Master data CRUD

Reason: These are global-impact actions.

B. Local Persistence Model

IndexedDB (via Dexie or similar)

Each mutation stored as:

{
  id,
  entity,
  action,
  payload,
  localTimestamp,
  baseVersion
}

C. Sync Strategy
When Online

Changes sync automatically

Server validates versions

Success → local record cleared

Conflict Detection

Conflict = server version ≠ baseVersion

D. Conflict Resolution UX (MANDATORY)
Conflict Modal
Conflict Detected
-----------------
This record was modified by another user.

Your Change:
- Ordered Qty: 20 → 25

Current System Value:
- Ordered Qty: 22

Choose Action:
[ Keep Mine ]  [ Use System ]  [ Cancel ]


No auto-merge

No silent override

Decision logged as AuditEvent

E. Visual Offline Indicators

Top bar badge: “Offline Mode”

Row-level badge: “Pending Sync”

Disable global actions visually

F. Service Worker Rules

Cache static assets

Cache last successful API reads

Never cache POST responses blindly

Background sync with retry & backoff

4. ORDER SLIP UPDATE & REGENERATE — FINAL UX RULES

This is subtle but very important.

A. Update vs Regenerate (Definitions)
Update Slip

Allowed before billing

Supplier / item name corrections

Same slip ID

Full audit log

Regenerate Slip

Deletes previous slip only if no billing status exists

Creates new slip version

Old slip archived (not deleted)

B. UI DESIGN
Admin / Procurement Head Dashboard

Buttons:

[ Generate Slips ]

[ Regenerate Slips ] (visible only if eligible)

Regenerate Confirmation
Regenerate Order Slips?
-----------------------
No billing activity detected.

Old slips will be archived.
New slips will be generated.

[ Cancel ]   [ Regenerate ]

C. Hard Locks

Once any of the following exists:

StatusEvent

Invoice ID

Duty session started

🚫 Regenerate disabled permanently

Button disappears, not disabled.

5. ICONOIR USAGE (FINAL)

Examples (to standardize):

Action	Iconoir Icon
Upload	upload
Validate	check
Process	play
DONE	check-circle
Locked	lock
Move	arrow-right
Return	undo
Regenerate	refresh
Conflict	warning-triangle

No emojis. Icons only.

FINAL CONFIRMATION

With these updates:

✅ Permissions now match real authority

✅ PPO Input ownership is correct

✅ Procurement Head has end-to-end control

✅ PWA/offline is safe and auditable

✅ Regeneration is powerful but controlled

✅ UI enforces governance, not training



I’m assuming Next.js (App Router) + TypeScript, Iconoir icons, TanStack Query, Dexie (IndexedDB), and a small client-side “sync engine” that talks to NestJS.

1) Final React folder/component structure (production-grade)
ppo-web/
├─ apps/
│  └─ web/
│     ├─ app/                               # Next.js App Router
│     │  ├─ (auth)/
│     │  │  ├─ login/
│     │  │  │  └─ page.tsx
│     │  │  └─ layout.tsx                   # Auth layout
│     │  ├─ (app)/
│     │  │  ├─ layout.tsx                   # Shell: navbar + sidebar
│     │  │  ├─ page.tsx                     # Dashboard (role-aware)
│     │  │  ├─ ppo/
│     │  │  │  ├─ input/                    # PPO Input (PROCUREMENT_HEAD+)
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ pending/                  # PO stage grid + allocator
│     │  │  │  │  └─ page.tsx
│     │  │  │  └─ rep/                      # REP stage grid
│     │  │  │     └─ page.tsx
│     │  │  ├─ slips/
│     │  │  │  ├─ today/
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ history/
│     │  │  │  │  └─ page.tsx
│     │  │  └─ status/
│     │  │     ├─ ledger/
│     │  │     │  └─ page.tsx
│     │  │     ├─ summary/
│     │  │     │  └─ page.tsx
│     │  │     ├─ supplier-reliability/
│     │  │     │  └─ page.tsx
│     │  │     ├─ fraud-alerts/
│     │  │     │  └─ page.tsx
│     │  │     └─ aging/
│     │  │        └─ page.tsx
│     │  │  ├─ analysis/
│     │  │  │  ├─ pending/
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ rep/
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ funnel/
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ slips/
│     │  │  │  │  └─ page.tsx
│     │  │  │  └─ exceptions/
│     │  │  │     └─ page.tsx
│     │  │  ├─ masters/                     # DB management (Admin/Super)
│     │  │  │  ├─ suppliers/
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ products/
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ item-name-changes/
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ reps/
│     │  │  │  │  └─ page.tsx
│     │  │  │  ├─ users/
│     │  │  │  │  └─ page.tsx
│     │  │  │  └─ system-settings/
│     │  │  │     └─ page.tsx
│     │  │  └─ audit/
│     │  │     ├─ logs/
│     │  │     │  └─ page.tsx
│     │  │     ├─ duty-sessions/
│     │  │     │  └─ page.tsx
│     │  │     └─ system-events/
│     │  │        └─ page.tsx
│     │  ├─ api/                            # Next route handlers (optional)
│     │  ├─ error.tsx
│     │  ├─ loading.tsx
│     │  └─ not-found.tsx
│     │
│     ├─ src/
│     │  ├─ core/
│     │  │  ├─ auth/
│     │  │  │  ├─ firebase.ts               # Firebase client init
│     │  │  │  ├─ session.ts                # token, role hydration
│     │  │  │  ├─ rbac.ts                   # permission checks
│     │  │  │  └─ guards.tsx                # <RequireRole/> <RequirePerm/>
│     │  │  ├─ api/
│     │  │  │  ├─ http.ts                   # fetch wrapper + auth + retry
│     │  │  │  ├─ endpoints.ts              # typed endpoints map
│     │  │  │  └─ schemas.ts                # zod schemas for validation
│     │  │  ├─ offline/
│     │  │  │  ├─ db.ts                     # Dexie schema
│     │  │  │  ├─ queue.ts                  # outbox enqueue/dequeue
│     │  │  │  ├─ sync-engine.ts            # state machine runner
│     │  │  │  ├─ conflict.ts               # conflict detection + resolution helpers
│     │  │  │  ├─ network.ts                # online/offline watcher
│     │  │  │  └─ policies.ts               # allowed offline actions
│     │  │  ├─ config/
│     │  │  │  ├─ env.ts                    # runtime env checks
│     │  │  │  └─ constants.ts              # app constants
│     │  │  └─ telemetry/
│     │  │     ├─ logger.ts                 # client logging
│     │  │     └─ audit-client.ts           # send client-audit breadcrumbs
│     │  │
│     │  ├─ design-system/
│     │  │  ├─ tokens/                      # spacing, radii, font sizes
│     │  │  ├─ components/
│     │  │  │  ├─ AppShell/
│     │  │  │  │  ├─ Navbar.tsx             # universal navbar + back + offline badge
│     │  │  │  │  ├─ Sidebar.tsx            # collapsible sidebar
│     │  │  │  │  └─ ShellLayout.tsx
│     │  │  │  ├─ Table/
│     │  │  │  │  ├─ DataGrid.tsx           # core grid (virtualized)
│     │  │  │  │  ├─ columns.ts             # column builder
│     │  │  │  │  ├─ Cell.tsx
│     │  │  │  │  ├─ RowActions.tsx
│     │  │  │  │  ├─ Selection.tsx
│     │  │  │  │  └─ grid-permissions.ts    # component-level RBAC
│     │  │  │  ├─ FilterBar/
│     │  │  │  │  ├─ FilterBar.tsx
│     │  │  │  │  ├─ FilterChip.tsx
│     │  │  │  │  └─ SavedViews.tsx
│     │  │  │  ├─ Modal/
│     │  │  │  │  ├─ Modal.tsx
│     │  │  │  │  ├─ ConfirmDialog.tsx
│     │  │  │  │  ├─ FormDialog.tsx
│     │  │  │  │  └─ ConflictDialog.tsx     # offline conflict resolver
│     │  │  │  ├─ Badge/
│     │  │  │  │  ├─ Badge.tsx              # status, offline, pending-sync
│     │  │  │  │  └─ StatusBadge.tsx
│     │  │  │  ├─ Forms/
│     │  │  │  │  ├─ TextField.tsx
│     │  │  │  │  ├─ SelectField.tsx
│     │  │  │  │  ├─ DateRange.tsx
│     │  │  │  │  └─ InlineEdit.tsx
│     │  │  │  ├─ Toast/
│     │  │  │  │  ├─ ToastHost.tsx
│     │  │  │  │  └─ toast.ts
│     │  │  │  └─ EmptyState/
│     │  │  │     └─ EmptyState.tsx
│     │  │  └─ icons/
│     │  │     └─ iconoir.ts                # single export point
│     │  │
│     │  ├─ modules/
│     │  │  ├─ ppo-input/
│     │  │  │  ├─ api.ts                    # hooks + calls
│     │  │  │  ├─ permissions.ts
│     │  │  │  ├─ components/
│     │  │  │  │  ├─ UploadCard.tsx
│     │  │  │  │  ├─ PreviewTable.tsx
│     │  │  │  │  └─ DuplicateReport.tsx
│     │  │  │  └─ state.ts                  # local UI state
│     │  │  ├─ ppo-pending/
│     │  │  │  ├─ api.ts
│     │  │  │  ├─ permissions.ts
│     │  │  │  ├─ allocator/
│     │  │  │  │  ├─ AllocatorPanel.tsx     # matches sheets allocator behavior
│     │  │  │  │  ├─ allocator-rules.ts
│     │  │  │  │  └─ notes-render.ts
│     │  │  │  ├─ components/
│     │  │  │  │  ├─ PendingGrid.tsx
│     │  │  │  │  ├─ MoveToRepDialog.tsx
│     │  │  │  │  └─ DoneToggleCell.tsx
│     │  │  │  └─ state.ts
│     │  │  ├─ rep-orders/
│     │  │  │  ├─ api.ts
│     │  │  │  ├─ permissions.ts
│     │  │  │  ├─ components/
│     │  │  │  │  ├─ RepGrid.tsx
│     │  │  │  │  ├─ ReturnToPendingDialog.tsx
│     │  │  │  │  └─ SupplierChangeDialog.tsx
│     │  │  │  └─ state.ts
│     │  │  ├─ slips/
│     │  │  │  ├─ api.ts
│     │  │  │  ├─ permissions.ts
│     │  │  │  ├─ components/
│     │  │  │  │  ├─ SlipList.tsx
│     │  │  │  │  ├─ SlipTable.tsx
│     │  │  │  │  ├─ StatusCell.tsx
│     │  │  │  │  ├─ StatusModal.tsx        # invoice required statuses
│     │  │  │  │  └─ DutyEndButton.tsx
│     │  │  │  └─ state.ts
│     │  │  ├─ status-ledger/
│     │  │  │  ├─ api.ts
│     │  │  │  ├─ permissions.ts
│     │  │  │  └─ components/
│     │  │  │     ├─ LedgerTable.tsx
│     │  │  │     └─ EventDrawer.tsx
│     │  │  ├─ analysis/
│     │  │  │  ├─ api.ts
│     │  │  │  └─ widgets/
│     │  │  └─ masters/
│     │  │     ├─ suppliers/
│     │  │     ├─ products/
│     │  │     ├─ reps/
│     │  │     ├─ users/
│     │  │     └─ settings/
│     │  │
│     │  ├─ hooks/
│     │  │  ├─ useHotkeys.ts                # keyboard shortcuts
│     │  │  ├─ useGridState.ts
│     │  │  ├─ useOfflineStatus.ts
│     │  │  └─ usePermissions.ts
│     │  │
│     │  ├─ types/
│     │  │  ├─ domain.ts                    # shared domain types (UI)
│     │  │  ├─ api.ts                       # api types
│     │  │  └─ permissions.ts
│     │  │
│     │  ├─ styles/
│     │  │  └─ globals.css
│     │  └─ utils/
│     │     ├─ format.ts
│     │     ├─ dates.ts
│     │     └─ guards.ts
│     │
│     ├─ public/
│     │  ├─ manifest.json
│     │  └─ icons/                          # PWA icons
│     ├─ next.config.js
│     ├─ package.json
│     └─ tsconfig.json
│
├─ packages/
│  ├─ domain/                               # shared types & rules (no React)
│  │  ├─ src/
│  │  │  ├─ entities/
│  │  │  ├─ enums/
│  │  │  ├─ validators/                     # zod validators
│  │  │  └─ rules/                          # allocator rules, status rules
│  │  └─ package.json
│  └─ ui-contracts/                         # OpenAPI-generated clients (optional)
│
└─ tooling/
   ├─ openapi/
   └─ scripts/

Why this structure works for your system

Design-system is isolated so grids/modals/badges are consistent everywhere.

modules/ matches your business windows exactly (PPO Input / PO Pending / REP / Slips / Status / Masters).

core/offline/ is a real subsystem (outbox + sync engine + conflict dialogs), not a hack.

packages/domain/ is where you freeze the “Sheets logic” in code so it doesn’t drift.

2) Offline-sync state machine diagram (authoritative)
A. System-level sync engine state machine (Mermaid)
stateDiagram-v2
  [*] --> ONLINE : navigator.onLine=true
  [*] --> OFFLINE : navigator.onLine=false

  OFFLINE --> OFFLINE_READY : app_loaded
  OFFLINE_READY --> QUEUEING : user_mutation
  QUEUEING --> QUEUEING : more_mutations
  QUEUEING --> OFFLINE_READY : mutation_saved_locally

  OFFLINE --> ONLINE : connection_restored
  ONLINE --> SYNCING : outbox_not_empty
  ONLINE --> ONLINE_READY : outbox_empty

  ONLINE_READY --> ONLINE_READY : user_mutation (online)
  ONLINE_READY --> SYNCING : user_mutation_requires_server_ack

  SYNCING --> SYNC_SUCCESS : all_items_acked
  SYNCING --> SYNC_PARTIAL : some_items_acked
  SYNCING --> CONFLICT : server_version_mismatch
  SYNCING --> SYNC_ERROR : network_error_or_5xx

  SYNC_PARTIAL --> SYNCING : continue_next_batch
  SYNC_ERROR --> BACKOFF : retry_policy
  BACKOFF --> SYNCING : timer_elapsed
  BACKOFF --> OFFLINE : connection_lost

  CONFLICT --> CONFLICT_UI : show_conflict_modal
  CONFLICT_UI --> SYNCING : user_resolved_keep_mine
  CONFLICT_UI --> SYNCING : user_resolved_use_system
  CONFLICT_UI --> ONLINE_READY : user_cancelled (mutation_stays_queued)

  SYNC_SUCCESS --> ONLINE_READY : outbox_empty

B. Per-record mutation lifecycle (outbox item)

This is the “row safety” layer.

stateDiagram-v2
  [*] --> DRAFT_LOCAL : user_edits_row
  DRAFT_LOCAL --> QUEUED : save_offline_or_submit
  QUEUED --> IN_FLIGHT : sync_attempt
  IN_FLIGHT --> ACKED : server_accepted
  IN_FLIGHT --> REJECTED : server_validation_failed
  IN_FLIGHT --> CONFLICTED : version_conflict

  REJECTED --> FIX_REQUIRED : show_validation_errors
  FIX_REQUIRED --> QUEUED : user_fixes_and_resubmits

  CONFLICTED --> RESOLUTION_REQUIRED : conflict_dialog
  RESOLUTION_REQUIRED --> QUEUED : resolved_keep_mine
  RESOLUTION_REQUIRED --> DROPPED : resolved_use_system

  ACKED --> [*]
  DROPPED --> [*]

Key rules (non-negotiable)

No silent merges

“Keep mine” creates an explicit override mutation (audited)

“Use system” drops the local mutation but logs that the user attempted

3) Offline policy enforcement (ties to your roles & stages)

Allowed offline actions (queueable):

PO Pending edits (Ordered/Stock/Offer/Supplier/Allocator outputs/DONE)

REP edits (Ordered Supplier, Notes, DONE, Return-to-Pending if not slipped)

Billing status edits (queued) until Duty End (Duty End itself requires online recommended; if offline, queue but must block conflicts hard)

Not allowed offline (must be online):

PPO Input upload/validate/process

Slip generation / regenerate

Masters CRUD (Suppliers/Products/Reps/Users/Settings)

UI behavior:

Buttons for disallowed actions disappear when offline (not disabled).

Any queued row shows a “Pending Sync” badge.


Got it.

* **Phone/Tablet:** editable **only in landscape**. In portrait, keep permissions but switch to **read-only UX** (no inline edits, no action buttons).
* **Conflicts:** **only Billing Head/Admin** can resolve. Everyone else can see “Blocked by Conflict” but can’t choose resolution.

Below are the three deliverables you asked for.

---

# A) Component-level API contracts (Table / Filter / Modal / Badge)

## A1) `DataGrid<T>` (Spreadsheet grid)

Purpose: one grid component used for **PO Pending**, **REP**, **Slips**, **Ledger**, **Masters**.

```ts
export type GridId = "ppoPending" | "repOrders" | "slipsToday" | "slipsHistory" | "statusLedger" | "masters";

export type GridDensity = "compact" | "comfortable";
export type GridEditMode = "inline" | "modal"; // inline default, modal for risky edits
export type RowLockReason =
  | "MovedToRep"
  | "SlipGenerated"
  | "DutyEnded"
  | "PermissionDenied"
  | "OfflineNotAllowed"
  | "Conflict"
  | "SystemLocked";

export type GridRowMeta = {
  id: string;
  version: number;                 // optimistic concurrency token
  locked?: boolean;
  lockReason?: RowLockReason;
  dirty?: boolean;                 // has local edits not synced
  conflict?: boolean;              // server conflict detected
  lastEditedAt?: string;
  lastEditedBy?: string;
};

export type ColumnType =
  | "text"
  | "number"
  | "currency"
  | "select"
  | "date"
  | "datetime"
  | "badge"
  | "checkbox"
  | "actions";

export type ColumnDef<T> = {
  key: string;                     // stable column key
  header: string;
  width?: number;                  // px
  minWidth?: number;
  type: ColumnType;
  pin?: "left" | "right";
  sortable?: boolean;
  filterable?: boolean;

  // Rendering
  value: (row: T) => any;
  render?: (ctx: { row: T; meta: GridRowMeta; value: any }) => React.ReactNode;

  // Editing
  editable?: (ctx: { row: T; meta: GridRowMeta; permissions: PermSet; ui: UiContext }) => boolean;
  editor?: (ctx: EditorCtx<T>) => React.ReactNode;  // overrides default editor per type
  validate?: (next: any, ctx: { row: T }) => string | null; // return error message
  onCommit?: (ctx: CommitCtx<T>) => Promise<void> | void;   // called on enter/blur
};

export type EditorCtx<T> = {
  row: T;
  meta: GridRowMeta;
  value: any;
  setValue: (next: any) => void;
  close: () => void;
  ui: UiContext;
  permissions: PermSet;
};

export type CommitCtx<T> = {
  row: T;
  meta: GridRowMeta;
  columnKey: string;
  prev: any;
  next: any;
  source: "keyboard" | "mouse" | "paste" | "api";
};

export type DataGridProps<T> = {
  gridId: GridId;
  rows: T[];
  rowMeta: Record<string, GridRowMeta>;
  columns: ColumnDef<T>[];

  density?: GridDensity;
  editMode?: GridEditMode;

  // selection
  selectable?: boolean;
  selectedRowIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;

  // sorting + paging
  sort?: { key: string; dir: "asc" | "desc" };
  onSortChange?: (sort: { key: string; dir: "asc" | "desc" }) => void;
  page?: { index: number; size: number; total: number };
  onPageChange?: (index: number) => void;

  // permissions + device policy
  permissions: PermSet;
  ui: UiContext; // device/orientation/online state, explained below

  // data operations
  onRefresh?: () => void;
  onRowAction?: (actionId: string, row: T) => void;

  // offline + conflicts
  offlinePolicy: OfflinePolicy;  // what can be edited offline
  onConflictClick?: (rowId: string) => void; // opens ConflictDialog if allowed

  // keyboard
  hotkeys?: GridHotkeys;
};
```

### `UiContext` (used everywhere)

```ts
export type Orientation = "portrait" | "landscape";
export type FormFactor = "desktop" | "tablet" | "phone";

export type UiContext = {
  online: boolean;
  orientation: Orientation;
  formFactor: FormFactor;

  // derived rule you set:
  canEditOnThisDevice: boolean; // true if desktop OR (tablet/phone + landscape)
};
```

---

## A2) `FilterBar` + Filter components

Purpose: consistent filtering with “Both (with filters)” behavior.

```ts
export type FilterKind =
  | "search"
  | "select"
  | "multiSelect"
  | "date"
  | "dateRange"
  | "toggle"
  | "status";

export type FilterDef = {
  key: string;
  label: string;
  kind: FilterKind;
  width?: number;              // px (desktop)
  options?: { label: string; value: string }[]; // select/multi
  placeholder?: string;

  // permissions: hide filter if not allowed
  visible?: (permissions: PermSet) => boolean;
};

export type FilterState = Record<string, any>;

export type FilterBarProps = {
  filterDefs: FilterDef[];
  value: FilterState;
  onChange: (next: FilterState) => void;

  // saved views
  enableSavedViews?: boolean;
  savedViewsKey?: string;      // per screen
  onSaveView?: (name: string, state: FilterState) => void;

  // layout
  compact?: boolean;           // used on tablet/phone landscape
  showChips?: boolean;         // show active filters as chips
};
```

---

## A3) `Modal` / `ConfirmDialog` / `FormDialog`

Purpose: every risky action is confirmed; status changes collect mandatory data.

```ts
export type ModalSize = "sm" | "md" | "lg" | "xl";

export type ModalProps = {
  open: boolean;
  title: string;
  size?: ModalSize;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;   // default false for critical actions
};

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;

  danger?: boolean;
  requireTypeToConfirm?: boolean;
  typeToConfirmText?: string;  // e.g., "MOVE"

  onConfirm: () => Promise<void> | void;
  onCancel: () => void;

  // permission gating
  allowed?: boolean;
  notAllowedMessage?: string;
};

export type FormDialogProps<T> = {
  open: boolean;
  title: string;
  initial: T;
  schema: any;                 // zod schema
  submitText?: string;
  onSubmit: (data: T) => Promise<void>;
  onCancel: () => void;
  lockCloseWhileSubmitting?: boolean;
};
```

### `ConflictDialog` (Head/Admin only)

```ts
export type ConflictDialogProps = {
  open: boolean;
  entity: { type: string; id: string };
  local: any;                  // local attempted change
  server: any;                 // current server version
  auditContext: { attemptedBy: string; attemptedAt: string };
  allowed: boolean;            // only BILLING_HEAD/ADMIN/SUPER_ADMIN

  resolutionOptions: Array<"KEEP_SYSTEM" | "FORCE_OVERRIDE">;

  onResolve: (resolution: "KEEP_SYSTEM" | "FORCE_OVERRIDE", reason: string) => Promise<void>;
  onClose: () => void;
};
```

---

## A4) `Badge` / `StatusBadge`

Purpose: visual truth for row state, sync, lock, conflict.

```ts
export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;      // Iconoir icon
  tooltip?: string;
};

export type StatusCode =
  | "BILLED"
  | "NOT_BILLED"
  | "PARTIALLY_BILLED"
  | "PRODUCT_CHANGED"
  | "SUPPLIER_ITEM_DAMAGED"
  | "SUPPLIER_ITEM_MISSING";

export type StatusBadgeProps = {
  status: StatusCode;
  compact?: boolean;
  showIcon?: boolean;
};
```

---

# B) Exact Figma frame list + responsive breakpoints

## Breakpoints (strict)

* **Desktop:** `>= 1280px`
* **Tablet:** `768px – 1279px`
* **Phone:** `< 768px`

## Orientation policy (strict)

* **Desktop:** editable (subject to RBAC)
* **Tablet/Phone Landscape:** editable (subject to RBAC)
* **Tablet/Phone Portrait:** **read-only UX** (even if role permits edits on desktop)

## Universal layout rules

* **Navbar:** fixed top, height 56px
* **Sidebar:** collapsible, 260px expanded / 72px collapsed
* **Universal Back Button:** always on navbar left (except dashboard root)
* **Offline/Sync Indicator:** navbar right (shows: Online / Offline / Pending Sync / Conflict)

---

## Figma frames (screen-by-screen)

### 0. Foundation

1. `00-DesignTokens`
2. `01-Components-Table`
3. `02-Components-FilterBar`
4. `03-Components-Modals`
5. `04-Components-Badges`
6. `05-Components-NavbarSidebar`

### 1. Auth

7. `10-Login-Desktop`
8. `11-Login-Tablet`
9. `12-Login-Phone`

### 2. App Shell (responsive templates)

10. `20-Shell-Desktop-ExpandedSidebar`
11. `21-Shell-Desktop-CollapsedSidebar`
12. `22-Shell-Tablet-Landscape`
13. `23-Shell-Tablet-Portrait-ReadOnlyBanner`
14. `24-Shell-Phone-Landscape`
15. `25-Shell-Phone-Portrait-ReadOnlyBanner`

### 3. Dashboard

16. `30-Dashboard-ProcurementHead`
17. `31-Dashboard-Admin`
18. `32-Dashboard-BillingHead`
19. `33-Dashboard-BillingStaff`
20. `34-Dashboard-OfflineState`

### 4. PPO Input (PROCUREMENT_HEAD only + Admin/Super)

21. `40-PPOInput-Upload`
22. `41-PPOInput-Preview`
23. `42-PPOInput-DuplicateReport`
24. `43-PPOInput-ConfirmProcess`

### 5. PO Pending (Allocator + Ordered/Stock/Offer + Move to REP + DONE)

25. `50-POPending-Grid`
26. `51-POPending-AllocatorPanel`
27. `52-POPending-MoveToRep-Confirm`
28. `53-POPending-RowLockedBlurredState`
29. `54-POPending-OfflineQueueBadges`
30. `55-POPending-Portrait-ReadOnly`

### 6. REP Orders (NO Ordered/Stock/Offer)

31. `60-REP-Grid`
32. `61-REP-ChangeSupplier-Dialog`
33. `62-REP-ReturnToPending-Dialog`
34. `63-REP-DoneToggle`
35. `64-REP-OfflineQueueBadges`
36. `65-REP-Portrait-ReadOnly`

### 7. Slip Generation (on Dashboard action)

37. `70-SlipGen-SettingsCard` (time, regenerate rules, last run)
38. `71-SlipGen-Generate-Confirm`
39. `72-SlipGen-Regenerate-Confirm` (your “update and regenerate”)

### 8. Order Slips (Billing execution)

40. `80-SlipsToday-SupplierList`
41. `81-SlipsToday-SlipTable`
42. `82-Slips-StatusModal-PartiallyBilled`
43. `83-Slips-StatusModal-ProductChanged`
44. `84-Slips-StatusModal-DamagedMissing`
45. `85-Slips-DutyEnd-Confirm`
46. `86-Slips-RowLockedAfterDutyEnd`
47. `87-Slips-OfflineQueuedStatus`
48. `88-Slips-ConflictBlocked-NonHead`
49. `89-Slips-ConflictResolver-HeadOnly`

### 9. Status Ledger (immutable)

50. `90-StatusLedger-Table`
51. `91-StatusLedger-EventDrawer`

### 10. Analysis

52. `100-Analysis-Pending`
53. `101-Analysis-REP`
54. `102-Analysis-Funnel`
55. `103-Analysis-Exceptions`

### 11. Masters

56. `110-Masters-Suppliers`
57. `111-Masters-Products`
58. `112-Masters-ItemNameChanges`
59. `113-Masters-RepMaster`
60. `114-Masters-UsersRoles`
61. `115-Masters-SystemSettings`

### 12. Audit & Logs

62. `120-Audit-Logs`
63. `121-DutySessions`
64. `122-SystemEvents`

---

# C) Micro-interactions + hotkeys matrix (authoritative)

## C1) Micro-interaction rules (global)

### Hover / Focus

* Hover row: subtle highlight (no color spec here, designer decides)
* Hover cell (editable): show pencil icon + tooltip “Edit”
* Focus cell: visible focus ring
* Locked row: blurred + disabled cursor + tooltip explaining lock reason
* Offline queued row: show “Pending Sync” badge at row start
* Conflict row: show “Conflict” badge + “Resolve” action **only for Head/Admin**

### Inline edit behavior

* `Enter`: edit cell
* `Esc`: cancel edit, revert to previous value
* `Tab`: commit + move right
* `Shift+Tab`: commit + move left
* `Arrow keys`: move selection (not edit)
* Paste: supports rectangular paste **only into editable columns**
* Validation errors: inline red message under cell, block commit

### Confirmations (must)

* Move to REP: confirm dialog with type-to-confirm “MOVE”
* Slip generation/regenerate: confirm dialog with type-to-confirm “GENERATE”
* Duty End: confirm dialog with warning “Cannot edit after Duty End (except Head override)”
* Status changes requiring invoice: modal must block submit until invoice present

### Portrait read-only behavior

* Show banner: “Portrait mode is read-only. Rotate to landscape to edit.”
* Hide inline editors and action buttons (not disabled—hidden)
* Allow: filters, search, sort, export (if role allows), open drawers

---

## C2) Hotkeys matrix (power user)

| Area       | Hotkey            | Action                                                         |
| ---------- | ----------------- | -------------------------------------------------------------- |
| Global     | `Ctrl+K`          | Open command palette (jump to screens)                         |
| Global     | `Alt+←`           | Universal Back                                                 |
| Global     | `Ctrl+R`          | Refresh current grid                                           |
| Global     | `Ctrl+Shift+L`    | Toggle sidebar collapse                                        |
| Grid       | `↑ ↓ ← →`         | Move selection                                                 |
| Grid       | `Enter`           | Edit cell (if editable)                                        |
| Grid       | `Esc`             | Cancel edit / close modal                                      |
| Grid       | `Tab / Shift+Tab` | Commit edit + next/prev cell                                   |
| Grid       | `Ctrl+C`          | Copy selected cell(s)                                          |
| Grid       | `Ctrl+V`          | Paste (editable cells only)                                    |
| Grid       | `Ctrl+F`          | Focus search filter                                            |
| Grid       | `Ctrl+S`          | Save (only if screen uses explicit save; most are auto-commit) |
| PO Pending | `Ctrl+M`          | Open “Move to REP” (if selected row eligible)                  |
| REP        | `Ctrl+U`          | Change supplier dialog (selected row)                          |
| Slips      | `Ctrl+E`          | Open status modal (selected row)                               |
| Slips      | `Ctrl+Shift+D`    | Duty End (Billing roles only)                                  |

### Safety gates for hotkeys

* If action not permitted → toast “Not allowed”
* If portrait on phone/tablet → toast “Rotate to landscape to edit”
* If offline and action disallowed offline → toast “Online required”

---

## C3) Conflict handling UX (your rule: heads/admin only)

* Non-head user sees:

  * Badge: “Conflict”
  * Tooltip: “Sent for resolution”
  * No resolve button
* Billing Head/Admin sees:

  * “Resolve Conflict” opens ConflictDialog
  * Options:

    * **Keep System**
    * **Force Override** (requires reason, becomes auditable override)

---

Below is a **production-ready** way to model permissions in TypeScript, plus an **exact mapping** from permissions → **screens** → **components/actions** (DataGrid/FilterBar/Modals/Buttons).

This is designed so devs don’t “guess” logic in UI—everything is driven by `PermSet`.

---

# 1) Roles (authoritative)

```ts
export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  PROCUREMENT_HEAD = "PROCUREMENT_HEAD",
  PURCHASE_STAFF = "PURCHASE_STAFF",
  BILLING_HEAD = "BILLING_HEAD",
  BILLING_STAFF = "BILLING_STAFF",
}
```

---

# 2) Permission constants

## 2.1 Permission keys

Keep permissions **atomic** (one responsibility each). Avoid mixing UI policy into RBAC.

```ts
export const PERM = {
  // App shell
  APP_VIEW: "app.view",
  SIDEBAR_VIEW: "sidebar.view",

  // PPO Input (Import)
  PPO_INPUT_VIEW: "ppoInput.view",
  PPO_INPUT_UPLOAD: "ppoInput.upload",
  PPO_INPUT_VALIDATE: "ppoInput.validate",
  PPO_INPUT_PROCESS: "ppoInput.process",

  // PO Pending (allocator + Ordered/Stock/Offer)
  PO_PENDING_VIEW: "poPending.view",
  PO_PENDING_EDIT_ORDERED: "poPending.edit.orderedQty",
  PO_PENDING_EDIT_STOCK: "poPending.edit.stockQty",
  PO_PENDING_EDIT_OFFER: "poPending.edit.offerQty",
  PO_PENDING_ALLOCATE: "poPending.allocate",                 // allocator usage (notes generation)
  PO_PENDING_EDIT_DECIDED_SUPPLIER: "poPending.edit.decidedSupplier",
  PO_PENDING_TOGGLE_DONE: "poPending.toggle.done",
  PO_PENDING_MOVE_TO_REP: "poPending.moveToRep",

  // REP Orders (no ordered/stock/offer)
  REP_VIEW: "rep.view",
  REP_EDIT_NOTES: "rep.edit.notes",
  REP_EDIT_ITEM_NAME_CHANGE: "rep.edit.itemNameChange",
  REP_EDIT_REP_ASSIGN: "rep.edit.repAssign",
  REP_EDIT_MOBILE: "rep.edit.mobile",
  REP_CHANGE_SUPPLIER: "rep.changeSupplier",
  REP_TOGGLE_DONE: "rep.toggle.done",
  REP_RETURN_TO_PENDING: "rep.returnToPending",

  // Slip generation (Dashboard action)
  SLIP_GEN_VIEW: "slipGen.view",
  SLIP_GEN_GENERATE: "slipGen.generate",
  SLIP_GEN_REGENERATE: "slipGen.regenerate",                 // your “update and regenerate”
  SLIP_GEN_EDIT_TIME: "slipGen.editGenerationTime",

  // Order Slips (billing execution)
  SLIPS_VIEW_TODAY: "slips.view.today",
  SLIPS_VIEW_HISTORY: "slips.view.history",
  SLIPS_SET_STATUS: "slips.setStatus",
  SLIPS_EDIT_STATUS_BEFORE_DUTY_END: "slips.editStatus.beforeDutyEnd",
  SLIPS_DUTY_END: "slips.dutyEnd",
  SLIPS_OVERRIDE_AFTER_DUTY_END: "slips.override.afterDutyEnd", // Billing Head

  // Conflict resolution (heads/admin only)
  CONFLICT_VIEW: "conflict.view",
  CONFLICT_RESOLVE: "conflict.resolve",

  // Status ledger (immutable)
  LEDGER_VIEW: "ledger.view",
  LEDGER_EXPORT: "ledger.export",

  // Analysis (derived)
  ANALYSIS_VIEW: "analysis.view",
  ANALYSIS_EXPORT: "analysis.export",

  // Masters CRUD
  MASTERS_VIEW: "masters.view",
  MASTERS_SUPPLIERS_CRU: "masters.suppliers.cru",
  MASTERS_PRODUCTS_CRU: "masters.products.cru",
  MASTERS_ITEM_NAME_CHANGES_CRU: "masters.itemNameChanges.cru",
  MASTERS_REP_MASTER_CRU: "masters.repMaster.cru",
  MASTERS_USERS_ROLES_CRU: "masters.usersRoles.cru",
  MASTERS_SYSTEM_SETTINGS_CRU: "masters.systemSettings.cru",

  // Audit & Logs
  AUDIT_VIEW: "audit.view",
  AUDIT_EXPORT: "audit.export",
} as const;

export type PermKey = (typeof PERM)[keyof typeof PERM];
```

## 2.2 `PermSet` type

```ts
export type PermSet = ReadonlySet<PermKey>;

export const hasPerm = (perms: PermSet, perm: PermKey) => perms.has(perm);
export const hasAll = (perms: PermSet, needed: PermKey[]) => needed.every(p => perms.has(p));
export const hasAny = (perms: PermSet, anyOf: PermKey[]) => anyOf.some(p => perms.has(p));
```

---

# 3) Role → PermSet mapping (authoritative)

This mapping matches what you specified:

* **PPO Input**: Procurement Head can upload/validate/process. Purchase Staff cannot.
* **PO Pending**: Procurement Head can view/edit/allocate/move-to-rep/done.
* **Slip generation**: Procurement Head can generate daily slips + regenerate/update.
* **Conflicts**: only heads/admin can resolve.
* **Billing duty end**: billing roles only.

```ts
export const ROLE_PERMS: Record<Role, PermKey[]> = {
  [Role.SUPER_ADMIN]: [
    PERM.APP_VIEW, PERM.SIDEBAR_VIEW,

    // PPO Input
    PERM.PPO_INPUT_VIEW, PERM.PPO_INPUT_UPLOAD, PERM.PPO_INPUT_VALIDATE, PERM.PPO_INPUT_PROCESS,

    // PO Pending
    PERM.PO_PENDING_VIEW,
    PERM.PO_PENDING_EDIT_ORDERED, PERM.PO_PENDING_EDIT_STOCK, PERM.PO_PENDING_EDIT_OFFER,
    PERM.PO_PENDING_ALLOCATE, PERM.PO_PENDING_EDIT_DECIDED_SUPPLIER,
    PERM.PO_PENDING_TOGGLE_DONE, PERM.PO_PENDING_MOVE_TO_REP,

    // REP
    PERM.REP_VIEW,
    PERM.REP_EDIT_NOTES, PERM.REP_EDIT_ITEM_NAME_CHANGE, PERM.REP_EDIT_REP_ASSIGN, PERM.REP_EDIT_MOBILE,
    PERM.REP_CHANGE_SUPPLIER, PERM.REP_TOGGLE_DONE, PERM.REP_RETURN_TO_PENDING,

    // Slip Gen
    PERM.SLIP_GEN_VIEW, PERM.SLIP_GEN_GENERATE, PERM.SLIP_GEN_REGENERATE, PERM.SLIP_GEN_EDIT_TIME,

    // Slips
    PERM.SLIPS_VIEW_TODAY, PERM.SLIPS_VIEW_HISTORY,
    PERM.SLIPS_SET_STATUS, PERM.SLIPS_EDIT_STATUS_BEFORE_DUTY_END, PERM.SLIPS_DUTY_END,
    PERM.SLIPS_OVERRIDE_AFTER_DUTY_END,

    // Conflicts
    PERM.CONFLICT_VIEW, PERM.CONFLICT_RESOLVE,

    // Ledger/Analysis
    PERM.LEDGER_VIEW, PERM.LEDGER_EXPORT,
    PERM.ANALYSIS_VIEW, PERM.ANALYSIS_EXPORT,

    // Masters + Audit
    PERM.MASTERS_VIEW,
    PERM.MASTERS_SUPPLIERS_CRU, PERM.MASTERS_PRODUCTS_CRU, PERM.MASTERS_ITEM_NAME_CHANGES_CRU,
    PERM.MASTERS_REP_MASTER_CRU, PERM.MASTERS_USERS_ROLES_CRU, PERM.MASTERS_SYSTEM_SETTINGS_CRU,
    PERM.AUDIT_VIEW, PERM.AUDIT_EXPORT,
  ],

  [Role.ADMIN]: [
    PERM.APP_VIEW, PERM.SIDEBAR_VIEW,

    // PPO Input
    PERM.PPO_INPUT_VIEW, PERM.PPO_INPUT_UPLOAD, PERM.PPO_INPUT_VALIDATE, PERM.PPO_INPUT_PROCESS,

    // PO Pending (if you want Admin to edit too; if not, remove edit perms)
    PERM.PO_PENDING_VIEW,
    PERM.PO_PENDING_EDIT_ORDERED, PERM.PO_PENDING_EDIT_STOCK, PERM.PO_PENDING_EDIT_OFFER,
    PERM.PO_PENDING_ALLOCATE, PERM.PO_PENDING_EDIT_DECIDED_SUPPLIER,
    PERM.PO_PENDING_TOGGLE_DONE, PERM.PO_PENDING_MOVE_TO_REP,

    // REP
    PERM.REP_VIEW,
    PERM.REP_EDIT_NOTES, PERM.REP_EDIT_ITEM_NAME_CHANGE, PERM.REP_EDIT_REP_ASSIGN, PERM.REP_EDIT_MOBILE,
    PERM.REP_CHANGE_SUPPLIER, PERM.REP_TOGGLE_DONE, PERM.REP_RETURN_TO_PENDING,

    // Slip Gen (you said Procurement Head generates; Admin can keep as backup)
    PERM.SLIP_GEN_VIEW, PERM.SLIP_GEN_GENERATE, PERM.SLIP_GEN_REGENERATE, PERM.SLIP_GEN_EDIT_TIME,

    // Slips read-only unless you want Admin to do billing
    PERM.SLIPS_VIEW_TODAY, PERM.SLIPS_VIEW_HISTORY,

    // Conflicts
    PERM.CONFLICT_VIEW, PERM.CONFLICT_RESOLVE,

    // Ledger/Analysis
    PERM.LEDGER_VIEW, PERM.LEDGER_EXPORT,
    PERM.ANALYSIS_VIEW, PERM.ANALYSIS_EXPORT,

    // Masters + Audit
    PERM.MASTERS_VIEW,
    PERM.MASTERS_SUPPLIERS_CRU, PERM.MASTERS_PRODUCTS_CRU, PERM.MASTERS_ITEM_NAME_CHANGES_CRU,
    PERM.MASTERS_REP_MASTER_CRU, PERM.MASTERS_USERS_ROLES_CRU, PERM.MASTERS_SYSTEM_SETTINGS_CRU,
    PERM.AUDIT_VIEW, PERM.AUDIT_EXPORT,
  ],

  [Role.PROCUREMENT_HEAD]: [
    PERM.APP_VIEW, PERM.SIDEBAR_VIEW,

    // PPO Input (explicitly allowed)
    PERM.PPO_INPUT_VIEW, PERM.PPO_INPUT_UPLOAD, PERM.PPO_INPUT_VALIDATE, PERM.PPO_INPUT_PROCESS,

    // PO Pending (full control)
    PERM.PO_PENDING_VIEW,
    PERM.PO_PENDING_EDIT_ORDERED, PERM.PO_PENDING_EDIT_STOCK, PERM.PO_PENDING_EDIT_OFFER,
    PERM.PO_PENDING_ALLOCATE, PERM.PO_PENDING_EDIT_DECIDED_SUPPLIER,
    PERM.PO_PENDING_TOGGLE_DONE, PERM.PO_PENDING_MOVE_TO_REP,

    // REP (owner)
    PERM.REP_VIEW,
    PERM.REP_EDIT_NOTES, PERM.REP_EDIT_ITEM_NAME_CHANGE, PERM.REP_EDIT_REP_ASSIGN, PERM.REP_EDIT_MOBILE,
    PERM.REP_CHANGE_SUPPLIER, PERM.REP_TOGGLE_DONE, PERM.REP_RETURN_TO_PENDING,

    // Slip Gen (explicitly allowed)
    PERM.SLIP_GEN_VIEW, PERM.SLIP_GEN_GENERATE, PERM.SLIP_GEN_REGENERATE,

    // Slips: view only (procurement typically read-only)
    PERM.SLIPS_VIEW_TODAY, PERM.SLIPS_VIEW_HISTORY,

    // Conflicts: view only OR resolve? You said “heads/admin”. This is a head role.
    PERM.CONFLICT_VIEW, PERM.CONFLICT_RESOLVE,

    // Ledger/Analysis
    PERM.LEDGER_VIEW, PERM.LEDGER_EXPORT,
    PERM.ANALYSIS_VIEW, PERM.ANALYSIS_EXPORT,

    // Masters view (CRU only if you want them to manage; else keep Admin only)
    PERM.MASTERS_VIEW,
  ],

  [Role.PURCHASE_STAFF]: [
    PERM.APP_VIEW, PERM.SIDEBAR_VIEW,

    // PPO Input: explicitly NOT allowed
    PERM.PPO_INPUT_VIEW, // optional: allow view-only; remove if you want hidden

    // PO Pending: view only unless you want them to assist allocator
    PERM.PO_PENDING_VIEW,

    // REP: view only
    PERM.REP_VIEW,

    // Slips: view only (if needed)
    PERM.SLIPS_VIEW_TODAY, PERM.SLIPS_VIEW_HISTORY,

    // Ledger/Analysis: view only
    PERM.LEDGER_VIEW,
    PERM.ANALYSIS_VIEW,
  ],

  [Role.BILLING_HEAD]: [
    PERM.APP_VIEW, PERM.SIDEBAR_VIEW,

    // Slips full
    PERM.SLIPS_VIEW_TODAY, PERM.SLIPS_VIEW_HISTORY,
    PERM.SLIPS_SET_STATUS, PERM.SLIPS_EDIT_STATUS_BEFORE_DUTY_END, PERM.SLIPS_DUTY_END,
    PERM.SLIPS_OVERRIDE_AFTER_DUTY_END,

    // Conflicts resolve (explicit)
    PERM.CONFLICT_VIEW, PERM.CONFLICT_RESOLVE,

    // Ledger/Analysis
    PERM.LEDGER_VIEW, PERM.LEDGER_EXPORT,
    PERM.ANALYSIS_VIEW, PERM.ANALYSIS_EXPORT,

    // Audit view
    PERM.AUDIT_VIEW, PERM.AUDIT_EXPORT,
  ],

  [Role.BILLING_STAFF]: [
    PERM.APP_VIEW, PERM.SIDEBAR_VIEW,

    // Slips limited (until Duty End)
    PERM.SLIPS_VIEW_TODAY, PERM.SLIPS_VIEW_HISTORY,
    PERM.SLIPS_SET_STATUS, PERM.SLIPS_EDIT_STATUS_BEFORE_DUTY_END, PERM.SLIPS_DUTY_END,

    // Ledger view only
    PERM.LEDGER_VIEW,

    // Analysis view only (optional)
    PERM.ANALYSIS_VIEW,
  ],
};
```

Helper to build the set:

```ts
export const permsForRole = (role: Role): PermSet => new Set(ROLE_PERMS[role] ?? []);
```

---

# 4) Component permission mapping (exact)

## 4.1 App Shell components

### `Navbar`

* Show **Universal Back**: `APP_VIEW`
* Show **Duty End** button: `SLIPS_DUTY_END` **and** role is billing (permission is enough)
* Show **Offline/Sync/Conflict indicator**: always visible if `APP_VIEW`

### `Sidebar`

* Visible if `SIDEBAR_VIEW`
* Items shown if screen `*.view` perm exists (see screen list below)

---

## 4.2 DataGrid gating rules (centralized)

Every screen passes:

* `permissions: PermSet`
* `ui.canEditOnThisDevice`

**Master rule (device):**

* If `ui.canEditOnThisDevice === false` → treat as read-only (hide editors/actions)

**Cell edit rule:**

* `ColumnDef.editable(...)` should check:

  1. has screen edit permission
  2. row not locked
  3. ui.canEditOnThisDevice is true
  4. online/offline policy allows it
  5. not conflict (unless head/admin and resolving through dialog)

---

# 5) Screen-by-screen permissions → UI components

## 5.1 PPO Input (Import)

**Screen access:** `PPO_INPUT_VIEW`

### Components

* `UploadButton`: `PPO_INPUT_UPLOAD`
* `ValidateButton`: `PPO_INPUT_VALIDATE`
* `ProcessOrdersButton`: `PPO_INPUT_PROCESS` (confirm modal required)
* `Preview DataGrid`: view-only always

**Purchase Staff**: no upload/validate/process → buttons hidden.

---

## 5.2 PO Pending (PO stage)

**Screen access:** `PO_PENDING_VIEW`

### DataGrid editable columns (permission → column)

* `Ordered Qty` → `PO_PENDING_EDIT_ORDERED`
* `Stock Qty` → `PO_PENDING_EDIT_STOCK`
* `Offer Qty` → `PO_PENDING_EDIT_OFFER`
* `Decided Supplier` → `PO_PENDING_EDIT_DECIDED_SUPPLIER`
* `DONE toggle` → `PO_PENDING_TOGGLE_DONE`

### Allocator

* `AllocatorPanel` open/use → `PO_PENDING_ALLOCATE`
* Notes column is allocator-produced (never free edit). Even if user has edit perms, do **not** allow manual Notes edits.

### Actions

* `Move to REP` button → `PO_PENDING_MOVE_TO_REP`

  * additionally enforce: DONE true + validations
  * confirm modal required

---

## 5.3 REP Orders (REP stage)

**Screen access:** `REP_VIEW`

### DataGrid editable columns

* `NOTES` → `REP_EDIT_NOTES`
* `ITEM NAME CHANGE` → `REP_EDIT_ITEM_NAME_CHANGE`
* `REP` assign → `REP_EDIT_REP_ASSIGN`
* `MOBILE` → `REP_EDIT_MOBILE`
* `ORDERED SUPPLIER` change → `REP_CHANGE_SUPPLIER`
* `DONE toggle` → `REP_TOGGLE_DONE`

### Actions

* `Return to Pending` → `REP_RETURN_TO_PENDING` (confirm modal + reason required)
* No Ordered/Stock/Offer fields appear at all.

---

## 5.4 Slip Generation (Dashboard action)

**Screen access:** `SLIP_GEN_VIEW`

### Components

* `Generate Daily Slips` → `SLIP_GEN_GENERATE` (confirm modal, type-to-confirm)
* `Regenerate/Update` → `SLIP_GEN_REGENERATE` (confirm modal, stronger warning)
* `Edit generation time` → `SLIP_GEN_EDIT_TIME` (if you decide Admin-only, remove from Procurement Head)

---

## 5.5 Order Slips (Billing execution)

**Screen access today:** `SLIPS_VIEW_TODAY`
**History:** `SLIPS_VIEW_HISTORY`

### DataGrid status editing rules

* Set status / open status modal → `SLIPS_SET_STATUS`
* Edit status (before Duty End) → `SLIPS_EDIT_STATUS_BEFORE_DUTY_END`
* Duty End → `SLIPS_DUTY_END`
* Override after Duty End → `SLIPS_OVERRIDE_AFTER_DUTY_END` (Billing Head)

### Conflict

* Non-heads: show Conflict badge; hide resolve button.
* Head/Admin: conflict dialog open → `CONFLICT_RESOLVE`

---

## 5.6 Status Ledger (immutable)

**Screen access:** `LEDGER_VIEW`

* Export button → `LEDGER_EXPORT`
* DataGrid is always read-only.

---

## 5.7 Analysis

**Screen access:** `ANALYSIS_VIEW`

* Export → `ANALYSIS_EXPORT`
* All read-only.

---

## 5.8 Masters (DB Management)

**Screen access:** `MASTERS_VIEW`

Per module CRU:

* Suppliers CRU → `MASTERS_SUPPLIERS_CRU`
* Products CRU → `MASTERS_PRODUCTS_CRU`
* Item Name Changes CRU → `MASTERS_ITEM_NAME_CHANGES_CRU`
* REP Master CRU → `MASTERS_REP_MASTER_CRU`
* Users & Roles CRU → `MASTERS_USERS_ROLES_CRU`
* System Settings CRU → `MASTERS_SYSTEM_SETTINGS_CRU`

If CRU perm missing → module becomes view-only or hidden (your choice; default: hidden).

---

## 5.9 Audit & Logs

**Screen access:** `AUDIT_VIEW`

* Export → `AUDIT_EXPORT`
* Read-only always.

---

# 6) Permission-aware component wrappers (recommended pattern)

## 6.1 `Can` helper

```ts
type CanProps = {
  perms: PermSet;
  need: PermKey | PermKey[];
  any?: boolean; // if true => OR; else AND
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function Can({ perms, need, any, children, fallback = null }: CanProps) {
  const list = Array.isArray(need) ? need : [need];
  const ok = any ? hasAny(perms, list) : hasAll(perms, list);
  return <>{ok ? children : fallback}</>;
}
```

## 6.2 `withDeviceEditPolicy`

```ts
export const canEditNow = (ui: UiContext, perms: PermSet, perm: PermKey) =>
  ui.canEditOnThisDevice && perms.has(perm);
```

Use this inside `ColumnDef.editable`.

---

# 7) Quick “who can do what” summary (sanity check)

* **PROCUREMENT_HEAD**

  * PPO Input: ✅ upload/validate/process
  * PO Pending: ✅ edit Ordered/Stock/Offer, allocator, move-to-rep, done
  * REP: ✅ manage, change supplier, done, return-to-pending
  * Slip Gen: ✅ generate + regenerate/update
  * Conflicts: ✅ resolve
  * Slips: 👁️ view only

* **PURCHASE_STAFF**

  * PPO Input: view-only (optional)
  * PO Pending/REP: view-only (unless you later allow assistance)
  * No conflicts

* **BILLING_STAFF**

  * Slips: status set/edit until Duty End + duty end
  * No conflict resolution

* **BILLING_HEAD**

  * Slips: override after Duty End + resolve conflicts

