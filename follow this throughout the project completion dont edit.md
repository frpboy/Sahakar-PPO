Sahakar PPO Web Application

Authoritative System Design & Architecture Documentation

1. EXECUTIVE OVERVIEW
1.1 What the System Does

The Sahakar PPO Web Application is a transaction-critical procurement orchestration system that manages the full lifecycle of pharmacy purchase orders, from raw order ingestion to supplier execution, reconciliation, and audit-grade analytics.

It replaces an existing Google Sheets + Google Apps Script–based PPO system while preserving 100% of the original business logic, workflows, validations, and audit behavior.

1.2 Why the System Exists

The existing Sheets-based system has reached its architectural limits:

High operational risk due to manual edits

No transactional guarantees

Complex Apps Script triggers acting as a pseudo-backend

Difficult auditing and forensic analysis at scale

Performance degradation with volume growth

Fragile concurrency and locking behavior

The web application exists to formalize the system of record, enforce correctness, and support scale, audits, disputes, and long-term sustainability.

1.3 Problems It Solves

Eliminates accidental data corruption

Guarantees immutable audit trails

Preserves human-driven overrides with traceability

Replaces script triggers with deterministic workflows

Enables future integrations (ERP, accounting, BI)

Provides a legally defensible data model

2. BUSINESS WORKFLOW MAP
2.1 High-Level Flow
INPUT
  ↓
PENDING
  ↓ (Manager decision)
REP
  ↓ (Allocation & split)
ORDER SLIP
  ↓ (Warehouse execution)
STATUS EVENTS
  ↓
ANALYSIS & REPORTING

2.2 Detailed Workflow & State Transitions
Stage 1: PPO Input (Order Ingestion)

Actor: System / HO Ops
Source: PPO Input Sheet (Excel import)

Orders are ingested with:

Accept date & time

Customer ID

Order ID

Product ID & name

Requested quantity

Supplier hints

Each line is hashed (Order + Product + Date)

Duplicate hashes are rejected

All rows are logged to a master immutable log

State: RAW_INGESTED

Stage 2: Daily Pending Order

Actor: HO Procurement
Purpose: Decision & triage

Rules:

Items classified as:

Active (supplier available)

NA (1111 / Not Available)

Stock (2222 / Stock in Hand)

Pending items are editable only for:

Ordered Qty

Stock Qty

Offer Qty

Notes

Supplier decision

A single explicit action moves an item to REP

State Transitions:

PENDING → REP

PENDING → NA

PENDING → BILLED (Stock)

Stage 3: Daily Rep Order

Actor: Sales Rep / Allocation Staff
Purpose: Quantity split & customer-level execution

Rules:

Allocation is done per product

Manual allocation overrides auto-split

Remarks are parsed for:

Order IDs

Customer IDs

Quantity splits

No direct deletion allowed

Move is destructive to Pending, append-only to Rep

State: ALLOCATED

Stage 4: Order Slip Generation

Actor: System (scheduled or manual trigger)
Purpose: Supplier-wise execution document

Rules:

Grouped strictly by supplier

One slip per supplier per day

Existing unbilled items are preserved

Item name change takes priority over original name

Each line item is uniquely identifiable

State: SLIP_GENERATED

Stage 5: Order Slip Execution (Warehouse)

Actor: Warehouse / Accounts

Allowed Statuses:

BILLED

NOT BILLED

PARTIALLY BILLED

PRODUCT CHANGED

SUPPLIER ITEM DAMAGED

SUPPLIER ITEM MISSING

Rules:

Status change requires mandatory data (qty, invoice, reason)

Each change creates an immutable status event

No overwrite of past events

State: EXECUTED

Stage 6: Status Ledger & Analysis

Actor: System / Management
Purpose: Audit, analytics, fraud detection

Derived outputs:

Master Status Ledger

Supplier reliability

Aging

Fraud alerts

Funnel metrics

3. DOMAIN MODEL
3.1 Core Entities

OrderRequest

PendingItem

RepItem

OrderSlip

OrderSlipItem

StatusEvent

Supplier

Customer

Product

User

Role

AuditEvent

ErrorEvent

3.2 Ownership & State Rules
Entity	Mutable	Owner
OrderRequest	❌	System
PendingItem	✅ (limited)	HO
RepItem	❌	Rep
OrderSlip	❌	System
OrderSlipItem	✅ (status only)	Warehouse
StatusEvent	❌	System
AuditEvent	❌	System
4. DATABASE DESIGN (RELATIONAL)
4.1 Core Tables
order_requests

id (PK)

accept_datetime

customer_id

order_id

product_id

product_name

packing

subcategory

primary_supplier

secondary_supplier

rep

mobile

mrp

req_qty

stage

hash (UNIQUE)

created_by

created_at

Indexes

unique(hash)

(customer_id, order_id)

(product_id)

pending_items

id (PK)

order_request_id (FK)

ordered_qty

stock_qty

offer_qty

notes

item_name_change

ordered_supplier

decided_supplier

move_to_rep

accept_date

accept_time

created_at

rep_items

id (PK)

pending_item_id (FK)

order_status

rep

mobile

moved_by

moved_at

order_slips

id (PK)

supplier

slip_date

created_by

created_at

order_slip_items

id (PK)

order_slip_id (FK)

customer_id

order_id

item_name

qty

remarks

status

qty_received

qty_damaged

qty_pending

invoice_id

new_item_name

notes

updated_by

updated_at

status_events (IMMUTABLE)

id (PK)

event_datetime

supplier

customer_id

order_id

item_old

item_new

qty

status

received_qty

bad_qty

pending_qty

invoice_id

notes

staff

audit_events (IMMUTABLE)

id (PK)

entity_type

entity_id

action

before_state (JSONB)

after_state (JSONB)

actor

created_at

5. TECH STACK (FINAL & OPINIONATED)

Frontend: Next.js (TypeScript)

Backend: NestJS (TypeScript)

Database: PostgreSQL (Cloud SQL)

Queue: Redis + BullMQ

Auth: Firebase Auth + DB-based RBAC

Hosting:

API → GCP Cloud Run

Web → Vercel

Storage: Google Cloud Storage

PDF: Server-side generation

6. API CONTRACTS (SUMMARY)
Example: Status Update

PATCH /slip-items/{id}/status

Request

{
  "status": "PARTIALLY_BILLED",
  "receivedQty": 5,
  "pendingQty": 2,
  "invoiceId": "INV123",
  "notes": "Partial supply"
}


Rules

Creates a StatusEvent

Appends AuditEvent

No mutation of past events

7. EVENT & WORKFLOW ENGINE
Replacements for Apps Script

Sheet onEdit → API mutation + DB transaction

Time triggers → Scheduled jobs

Locks → DB row-level locking

Flags → Explicit state machines

8. UI / UX MODULES
Screens

Order Import

Pending Orders

Rep Orders

Order Slips

Receiving & Status

Master Status Ledger

Analytics Dashboard

UX Constraints

Spreadsheet-like grids

Mandatory confirmations

Zero silent failure

Sub-second feedback

Read-only historical data

9. LOGGING, AUDIT & COMPLIANCE

Every mutation produces:

AuditEvent

(If applicable) StatusEvent

Logs are append-only

No hard deletes

User identity captured for every action

Designed for dispute resolution

10. MIGRATION STRATEGY
Steps

Export all Sheets

Transform to canonical schema

Import with hash validation

Parallel run (read-only web)

Reconciliation checks

Final cutover

Disable Apps Script triggers

11. NON-FUNCTIONAL REQUIREMENTS

Correctness > Speed

ACID transactions

Horizontal scalability

Strong indexing

Zero data loss

Full traceability

Secure role isolation

12. PROJECT FOLDER STRUCTURE
ppo-system/
├── apps/
│   ├── web/
│   └── api/
├── workers/
│   ├── slip-generator/
│   └── analytics/
├── packages/
│   └── domain/
├── migrations/
├── docs/
│   ├── architecture.md
│   ├── workflows.md
│   └── audit-model.md

FINAL NOTE (AS SYSTEMS AUDITOR)

This system is not a CRUD app.
It is a financially and operationally sensitive transaction engine.

This answer is intentionally long, explicit, and audit-safe.

PART A — SCREEN-LEVEL UX WIREFRAMES

(Authoritative UI specification – not visual mockups, but exact layout & behavior)

GLOBAL UX PRINCIPLES (NON-NEGOTIABLE)

Spreadsheet mental model

Rows behave like Sheets

Inline editing where allowed

Immutable history

No overwrite of executed data

Role-gated actions

Buttons do not appear if not permitted

Every action = confirmation

Especially status changes

Speed over beauty

Sub-second response on grids

Keyboard-friendly

Power-user ready (procurement & billing)

ROLE DEFINITIONS (BOUND)
Role	Internal Code	Users
Super Admin	SUPER_ADMIN	Rahul, Zabnix
Admin	ADMIN	Ashiq, Sarath, Vipeesh
Purchase Staff	PURCHASE	Drisya, Jamsheera, Sujitha
Billing Head	BILLING_HEAD	Abhi
Billing Staff	BILLING	Sujeev, Shafi, Shiji, Vivek, Jalvan, Suhail, Fayis
SCREEN 1 — AUTH / ACCESS GATE
Purpose

Identity verification

Role resolution

Layout
[ Sahakar PPO Logo ]

Email
Password
[ Login ]

— Access restricted to authorized staff —

Rules

Firebase Auth email login

Role fetched from DB

No self-registration

Disabled accounts blocked hard

SCREEN 2 — ORDER IMPORT (PPO INPUT)
Roles

ADMIN

PURCHASE

SUPER_ADMIN

Purpose

Manual import of outlet order files (Excel).

Layout
Header: Import Purchase Orders

[ Upload Excel File ]

-----------------------------------------
| Preview Table (Read-Only)             |
|---------------------------------------|
| Accept Date | Cust | Order | Product |
| Qty | Supplier Hint | Stage           |
-----------------------------------------

[ Validate ]
[ Import ]

Behavior

Validate headers strictly

Show hash collisions before import

Import = append-only

Creates OrderRequest records

Creates AuditEvent per file

SCREEN 3 — PENDING PURCHASE ORDERS (PPO)
Roles

PURCHASE

ADMIN

SUPER_ADMIN

Purpose

HO Procurement decision screen.

Layout
Header: Pending Purchase Orders

Filters:
[ Supplier ▼ ] [ Product ▼ ] [ Rep ▼ ] [ Date ▼ ]

-------------------------------------------------------------
| Product | Req Qty | Ordered | Stock | Offer | Notes | ... |
-------------------------------------------------------------
| Item A  |   120   |   [ ]   | [ ]   | [ ]   | [ ]   |     |
-------------------------------------------------------------

[ Move to REP ]

Editable Columns

Ordered Qty

Stock Qty

Offer Qty

Notes

Decided Supplier

Change to REP (YES/NO)

Actions

Move to REP

Confirmation modal

Transactional move

Pending row disappears

Rep row created

Hard Rules

Cannot edit after move

NA / Stock auto-routed

SCREEN 4 — REP ORDER ALLOCATION
Roles

ADMIN

PURCHASE

SUPER_ADMIN

(Rep here is workflow stage, not external sales rep)

Purpose

Split bulk quantities per customer order.

Layout
Header: Rep Allocation

Selected Product: XYZ
Total Req Qty: 250

------------------------------------
| Customer | Order | Req | Buy | Stk |
------------------------------------
| C001     | O101  | 50  | [ ] | [ ] |
| C002     | O102  | 40  | [ ] | [ ] |
------------------------------------

[ Save Allocation ]

Behavior

Mirrors Apps Script sidebar

Manual > auto split

Writes notes exactly like Sheets

Logs allocation snapshot

SCREEN 5 — ORDER SLIPS (SUPPLIER VIEW)
Roles

ADMIN

BILLING_HEAD

SUPER_ADMIN

Purpose

Supplier-wise execution document.

Layout
Header: Order Slips

[ Supplier ▼ ] [ Date ▼ ]

================= SUPPLIER: ABC PHARMA =================
Customer | Order | Item | Qty | Remarks | Status ▼
-----------------------------------------------------
C001     | O101  | Item | 10  | Buy 10  | BILLED
-----------------------------------------------------

Features

Grouped by supplier

PDF export

Preserves old unbilled lines

Item name change visible

SCREEN 6 — BILLING / RECEIVING (STATUS EXECUTION)
Roles

BILLING

BILLING_HEAD

SUPER_ADMIN

Purpose

Warehouse / accounts execution.

Status Dropdown
BILLED
NOT BILLED
PARTIALLY BILLED
PRODUCT CHANGED
SUPPLIER ITEM DAMAGED
SUPPLIER ITEM MISSING

Modal Examples

PARTIALLY BILLED

Total Qty: 10

Billed Qty: [   ]
Not Billed Qty: [   ]

[ Confirm ]


PRODUCT CHANGED

Old Item: XYZ
New Item Name: [     ]
Received Qty: [     ]

[ Confirm ]

Rules

Mandatory inputs

Each confirmation → StatusEvent

No rollback

SCREEN 7 — MASTER STATUS LEDGER
Roles

ADMIN

BILLING_HEAD

SUPER_ADMIN

AUDITOR (future)

Purpose

Immutable audit trail.

Layout
Date | Supplier | Cust | Order | Item | Status | Qty | Invoice

Rules

Read-only

Export allowed

Used for disputes

SCREEN 8 — ANALYTICS & DASHBOARD
Roles

ADMIN

SUPER_ADMIN

Sections

Pending vs Rep Funnel

Supplier Reliability

Aging

Fraud Alerts

Manual vs Auto stats

Behavior

Derived only

No manual edits

Background computed

PART B — FULL OPENAPI SPEC (SUMMARY + CORE)

Below is a production-grade OpenAPI structure.
(Condensed here; suitable to be expanded into a YAML file.)

OPENAPI METADATA
openapi: 3.0.3
info:
  title: Sahakar PPO API
  version: 1.0.0
  description: Authoritative PPO backend replacing Google Sheets system
servers:
  - url: https://api.sahakarppo.com
security:
  - bearerAuth: []

AUTH
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

CORE ENDPOINTS
Import Orders
POST /orders/import
roles: ADMIN, PURCHASE, SUPER_ADMIN
idempotency: file_hash


Request:

{
  "fileId": "gcs://imports/input.xlsx"
}

Get Pending PPO
GET /pending
roles: PURCHASE, ADMIN, SUPER_ADMIN

Update Pending Row
PATCH /pending/{id}
roles: PURCHASE, ADMIN

Move to REP
POST /pending/{id}/move-to-rep
roles: PURCHASE, ADMIN
transactional: true

Rep Allocation
POST /rep/{id}/allocate
roles: ADMIN, PURCHASE

Generate Order Slips
POST /slips/generate
roles: ADMIN, SUPER_ADMIN
idempotent: true

Update Slip Status
PATCH /slip-items/{id}/status
roles: BILLING, BILLING_HEAD
creates: StatusEvent

Master Status Ledger
GET /status-events
roles: ADMIN, BILLING_HEAD, SUPER_ADMIN

Analytics
GET /analytics/pending
GET /analytics/funnel
GET /analytics/supplier-score
GET /analytics/fraud

GLOBAL RULES (ENFORCED BY API)

Every write → AuditEvent

Status change → StatusEvent

No DELETE on transactional entities

Optimistic locking on mutable stages

Strict RBAC per endpoint

✅ WINDOW 1 — PPO INPUT (LOCKED SPEC)
1. Purpose (Final)

The PPO Input window is pure ingestion + orchestration trigger.

It is not a working screen.
It exists to:

Accept a perfect ERP-generated file

Persist raw data immutably

Generate downstream operational datasets (Pending, NA, Stock, etc.)

2. Data Handling Rules (Final)
2.1 Import Behavior

Input file is always correct (ERP source)

No manual correction

No partial save

No transformation before persistence

Rule:

Raw rows are stored exactly as imported, byte-for-byte equivalent in meaning.

2.2 Mutability

PPO Input rows are read-only forever

No edits

No deletes

No reprocessing per-row

This maps perfectly to:

order_requests table

append-only design

2.3 “Stage” Clarification (Resolved)

There is NO staff-controlled “stage” field in PPO Input.

What you currently call stage in the sheet is:

A derived / internal classification

Used only during processing

Not a user-editable field

👉 In the web app:

Stage will not appear in PPO Input UI

Stage will be assigned internally during processing

2.4 Aggregation Rule (Critical — Locked)

Pending is PRODUCT-LEVEL aggregated

NOT line-by-line customer orders

Aggregation key:

Product ID (+ supplier context if applicable)


Aggregation output includes:

Total Requested Qty

Combined Remarks:

Ord:<orderId> Cust:<customerId> Qty:<reqQty>


This is a hard invariant across the system.

2.5 Duplicate Handling (Updated)

Duplicates are detected

Duplicates are reported

Duplicates are NOT silently skipped

👉 In the web app:

Import preview will show:

Accepted rows

Duplicate hashes (read-only report)

Only non-duplicate rows are committed

2.6 Append vs Replace (Important)

❗ Pending data is NOT fully replaced on every import

Final rule:

If NO order slip has been generated yet → Pending can be regenerated

If ANY order slip exists → Pending is append-only

This preserves:

Already-processed supplier work

Billing continuity

Historical correctness

3. Final PPO Input Web Screen (Authoritative)
UI Elements

Upload Excel

Preview (read-only)

Duplicate Report (read-only)

PROCESS ORDERS button

Button Behavior

PROCESS ORDERS

Runs aggregation + classification

Writes:

Pending (append-aware)

NA bucket

Stock bucket

Emits:

AuditEvent (file-level)

ErrorEvents if any

4. Database Mapping (Final)
Sheet Concept	Web App
PPO Input	order_requests
Initial Logs	audit_events (IMPORT)
Master Logs	audit_events (SYSTEM)
5. What Will NEVER Happen in Window 1

❌ Editing quantities

❌ Changing supplier

❌ Deleting rows

❌ Manual stage assignment

❌ Auto overwrite of Pending after slips exist

This window is now fully frozen.


WINDOW 2 — DAILY PENDING PPO (✅ LOCKED SPEC)

Below is the final, corrected understanding, incorporating your inputs.

1. Notes Column — Final Meaning (Very Important)

✅ Notes must show allocator distribution, not free text.

That means Notes will contain system-generated allocation output, for example:

Ord 1023: 5(Buy), 3(Stk)
Ord 1024: 10(Buy), 2(Off)


Rules:

Generated only via Allocator UI

Editable only through allocator

Never manually typed in grid

Serves as the single source of truth for downstream splitting (REP → Slips)

This is critical, because Order Slip generation relies on this structure.

✅ Locked.

2. “Change to REP = YES” — Final Behavior

Confirmed final flow:

User sets Change to REP = YES

System performs validations

Row becomes locked

Row becomes hidden / blurred in Pending

A new row is created in REP

This action is irreversible from Pending

However ⬇️⬇️⬇️

Controlled Exception (NEW, IMPORTANT)

If a REP / Supplier is not available,
a manual action in REP page must allow moving the row back to Pending

⚠️ This is NOT a rollback.
⚠️ This is a new controlled transition, with full audit.

So we now have one allowed reverse path, but only from REP screen, not Pending.

I’ll design this carefully when we reach Window 3.

3. “Are These Enforced Today, or Followed by Discipline?” — Explained

This is what you asked me to explain.

Today (Google Sheets + Apps Script reality)
Rule	Enforcement
Ordered + Stock + Offer ≤ Requested	❌ Mostly discipline
Ordered Qty > 0 before REP	⚠️ Partially scripted
Supplier required before REP	⚠️ Partially scripted
No edit after move	✅ Script enforced
Allocator notes format	✅ Script enforced

In short:

Critical transitions are enforced by script

Quantity sanity is largely human-discipline based

In Web App (MANDATORY CHANGE)

All of the following become hard-enforced system rules:

Ordered + Stock + Offer ≤ Requested

Ordered Qty must be ≥ 0

Change to REP requires:

Ordered Qty > 0

Decided Supplier present

Notes must be allocator-generated

Pending rows cannot be edited once locked

This is not a behavior change —
it is a formalization of existing intent.

Auditors will thank you later.

4. Partial Movement — Final

Confirmed:

❌ No partial movement

❌ No splitting a product across stages

✅ Always full product row

Locked.

5. REP Page — Supplier Mutability

You said:

“rep pages needs more discussions”

So for now we lock this minimum guarantee:

Supplier selected in Pending is initial supplier

REP page may allow supplier reassignment, but:

Only via explicit action

With mandatory reason

Logged as an event

We’ll finalize this in Window 3.

6. Pending PPO — What Is Now Officially LOCKED
Allowed

Allocator-based quantity distribution

Supplier decision

Move to REP

Filtering (product / supplier / rep / date)

Forbidden

Editing requested qty

Manual notes editing

Customer-level manipulation

Reverting REP move from Pending

Deleting rows

7. State Model for Pending PPO (Canonical)
IMPORTED
  ↓
PENDING (editable)
  ↓ Change to REP
LOCKED_PENDING (hidden)
  ↓
REP_ACTIVE


Reverse path (exception):

REP_ACTIVE
  ↓ "Return to Pending" (manual, audited)
PENDING (new instance, new event)


⚠️ This is not a rollback — it is a new lifecycle event.


✅ WINDOW 2 — DAILY PENDING PPO (FINAL & LOCKED)
Your Final Confirmations (Applied)

Order Slip generated → goes to histories (date-based)

Pending/REP are operational views

Once slips are generated, those records are archived by date and no longer live-editable

Return to Pending uses the OLD record

No cloning

No new row

Same Pending row is re-activated (unlocked) from REP

Full audit entry is mandatory

Allocator Notes = single source of truth

All downstream splitting (REP → Slips) reads only allocator output

No alternate parsing paths

Canonical State Machine (Locked)
IMPORTED
  ↓
PENDING (editable)
  ↓ Change to REP
LOCKED_PENDING (hidden/blurred)
  ↓
REP_ACTIVE
  ↓ Generate Order Slip (manual)
SLIP_GENERATED
  ↓
HISTORY (date-based, immutable)

Controlled Exception (also locked)
REP_ACTIVE
  ↓ Return to Pending (manual, audited)
PENDING (same record reactivated)


⚠️ This is not a rollback.
It is a state transition on the same entity, with a mandatory reason.

Enforcement (Web App – Non-Negotiable)

Hard validations (system-enforced):

Ordered + Stock + Offer ≤ Requested

Ordered Qty > 0 to move to REP

Decided Supplier required to move to REP

Allocator-only Notes

Immutability:

After REP move → Pending row locked/hidden

After Slip generation → history-only

What’s Now Officially Out of Scope for Pending

Any customer-level editing

Partial movement

Manual note typing

Deleting rows

Reverting from Pending



✅ WINDOW 3 — REP (Bulk Supplier Procurement)

STATUS: FINAL & LOCKED

Owner: Procurement Head
Nature: Internal bulk ordering stage
Allocator: ❌ Not used here
Customers: ❌ Never visible
Purpose: Final supplier-side preparation before Order Slip generation

1. Role & Control

Primary owner: Procurement Head

Admin: System configuration + override

Billing / Others: ❌ No access

This is a decision + readiness stage, not calculation.

2. REP Table — Final Column Definition (Authoritative)

Each row = one product, already aggregated.

Columns (Exact, Locked)
Column	Editable	Notes
PROD ID	❌	Identity
MRP	❌	Informational
PACKING	❌	Informational
ITEM NAME	❌	Uses name-change if present
REMARKS	❌	From Pending (customer aggregation)
CATEGORY	❌	Informational
SUBCATEGORY	❌	Informational
REQ QTY	❌	Frozen
NOTES	✅	Internal procurement notes
ORDER STATUS	✅	Workflow indicator
ITEM NAME CHANGE	✅	Optional correction
REP	✅	Internal reference
MOBILE	✅	Internal
CHANGE TO PO (DONE)	✅	Action control
ORDERED SUPPLIER	✅	Can be changed
PRIMARY SUP	❌	Reference
SECONDARY SUP	❌	Reference
ACCEPT DATE	❌	System
ACCEPTED TIME	❌	System

🚫 Explicitly NOT present in REP

Ordered Qty

Stock Qty

Offer Qty

Decided Supplier (renamed to ORDERED SUPPLIER, editable)

3. Key Behavioral Rules (Locked)
3.1 Allocator

❌ Not used

❌ Not visible

❌ Not editable

Allocator logic ends at Pending.

3.2 Supplier Handling (Locked)

Supplier CAN be changed in REP

Change is:

Explicit

Logged

Not silent

Supplier DB is authoritative (no free text)

4. DONE Button (Critical Rule)

DONE is mandatory
Only DONE rows move forward.

Applies to:

Pending PPO

REP PPO

Meaning:

Row is ready for Order Slip

Row is frozen

Row is eligible for inclusion

🚫 Rows without DONE are ignored entirely.

5. Order Slip Generation — Final Rules
Where

Admin Dashboard only

Not inside REP grid

When

Only once per day

Exact time decided by Admin

Time is configurable (example: 4:00 PM)

Scope

One consolidated Order Slip per supplier per day

Pulls:

Only REP rows

Only rows with DONE = true

Only rows not already slipped

After Generation

Rows become immutable

State → SLIP_GENERATED

Move to date-based history

🚫 No regeneration
🚫 No multiple slips per day
🚫 No partial supplier slips

6. Immutability (Hard Rule)

Once:

DONE = clicked and

Order Slip generated

Then:

❌ No edits

❌ No supplier change

❌ No return to Pending

❌ No deletion

This is audit-grade immutability.

7. Return to Pending (From REP)

Allowed only before Order Slip generation.

Rules:

Uses same original Pending row

No cloning

Mandatory reason

Logged event

Admin / Procurement Head only

8. REP Database Requirements (Confirmed)

We will create separate master tables:

REP Master

id

name

mobile

designation

active flag

created_by / created_at

updated_by / updated_at

➡️ CRU by Admin

Supplier Master

id

supplier_name

contact_person

mobile

email

GST

credit_days

active flag

created_by / timestamps

➡️ CRU by Admin

Product Master

Will sync with your existing ERP DB

PPO references product_id only

No duplication of business logic

9. REP State Machine (Final)
REP_ACTIVE
  ↓ DONE
READY_FOR_SLIP
  ↓ (Admin scheduled run)
SLIP_GENERATED
  ↓
HISTORY (date-based, immutable)


Exception:

REP_ACTIVE
  ↓ Return to Pending
PENDING (reactivated)

10. What REP Must NEVER Allow (Locked)

❌ Allocator usage

❌ Quantity edits

❌ Editing requested qty

❌ Slip generation per row

❌ Multiple slips per day

❌ Editing after slip generation

❌ Silent supplier changes





✅ WINDOW 4 — ORDER SLIPS (Billing Execution UI)

STATUS: FINAL & LOCKED

Purpose: Billing execution & supplier invoice reconciliation
Audience: Billing Staff, Billing Head
Data Sensitivity: Highest (audit-grade)

1. Eligibility Rules (Strict)

Order Slips are populated only from:

✅ REP rows with DONE = true

✅ PO rows with DONE = true (if PO stage exists upstream)

Anything not DONE does not appear, ever.

2. Item Name Resolution (Critical Fix Applied)

Final rule (locked):

If ITEM NAME CHANGE has a value →
That name must appear in Order Slips

Priority order:

ITEM NAME CHANGE (if present)

Original ITEM NAME

This ensures:

Warehouse bills against actual supplied item

Audit trail still preserves original item in status logs

3. Status List (Final)

Allowed statuses (unchanged list, clarified behavior):

BILLED

NOT BILLED

PRODUCT CHANGED

SUPPLIER ITEM DAMAGED

SUPPLIER ITEM MISSING

PARTIALLY BILLED

🚫 No custom values
🚫 No renaming
🚫 No free text statuses

4. Invoice ID Requirement (Updated & Locked)

You confirmed:

Invoice ID must be mandatory for the following statuses:

✅ PRODUCT CHANGED

✅ SUPPLIER ITEM DAMAGED

✅ SUPPLIER ITEM MISSING

✅ PARTIALLY BILLED

Popup behavior (final):

Each of these popups must include:

Invoice ID (required)

Quantity inputs (as applicable)

Reason / notes (if applicable)

System must block submission until invoice ID is entered.

5. Status Editing & Duty End Button (Important Change)
New Concept: Duty End

Every Billing Staff has a “Duty End” button

Located at top-right navbar

Represents end of shift / responsibility handover

Editing Rules (Locked)
Phase	Can Edit Status?
Before Duty End	✅ Yes
After Duty End	❌ No (locked)

Meaning:

Status can be changed until Duty End

After Duty End:

All rows touched by that staff become immutable

No further edits allowed

This replaces “instant irreversibility” with shift-based finalization.

6. Override Rules (Billing Head)

You confirmed:

Billing Head CAN override, but reason is mandatory

Final behavior:

Billing Head can:

Change status entered by Billing Staff

Before OR after staff Duty End

Must:

Provide override reason

Be logged as a separate audit event

🚫 Overrides do not erase original entry
They append a new status event.

7. Concurrency (Confirmed)

✅ Multiple staff can work on the same Order Slip simultaneously

Row-level locking applies:

While popup is open → row locked

After save → row released (until Duty End)

No sheet-level locks.

8. Permissions (Final)
Role	Permissions
Billing Staff	Set & edit status (until Duty End)
Billing Head	Set, edit, override with reason
Admin	Full read
Procurement Head	Read-only
Super Admin	Full read (no silent edits)

❌ Admin / Super Admin cannot bypass audit logic.

9. Logging Rules (Reconfirmed)

Every status action logs immutably:

Timestamp

Supplier

Customer ID

Order ID

Original Item

Final Item (if changed)

Ordered Qty

Received / Damaged / Missing / Pending

Status

Invoice ID

Notes / Reason

Staff identity

Override flag (if any)

🚫 No deletes
🚫 No updates
🚫 Append-only forever

10. Final State Machine (Locked)
SLIP_CREATED
  ↓ (Billing Staff)
STATUS_SET (editable until Duty End)
  ↓ Duty End
LOCKED
  ↓ (optional Billing Head override)
OVERRIDDEN (logged)
  ↓
HISTORY (immutable)

11. What Order Slips Must NEVER Allow (Final)

❌ Editing after Duty End (except Billing Head override)

❌ Status change without popup validation

❌ Missing invoice ID where required

❌ Quantity typing outside popups

❌ Deleting or regenerating slips

❌ Silent overrides


✅ SIDEBAR & MODULE SEPARATION (LOCKED)

We will explicitly separate concerns. This mirrors how auditors, billing, and procurement think.

Final Sidebar Structure
Dashboard

PPO
  ├─ PPO Input
  ├─ Pending Purchase Orders
  ├─ REP Orders

Order Slips
  ├─ Today’s Order Slips
  ├─ Order Slip History (date-wise)

Order Slip Status
  ├─ Master Status Ledger
  ├─ Status Summary
  ├─ Supplier Reliability
  ├─ Fraud Alerts
  ├─ Aging Report

Analysis
  ├─ Pending Analysis
  ├─ REP Analysis
  ├─ Funnel Analysis
  ├─ Order Slip Analysis
  ├─ Exception Analysis

Masters (DB Management)
  ├─ Suppliers
  ├─ Products
  ├─ Item Name Changes
  ├─ REP Master
  ├─ Users & Roles
  ├─ System Settings

Audit & Logs
  ├─ Audit Logs
  ├─ Duty Sessions
  ├─ System Events

Why this matters

Order Slip Status ≠ Analysis

Status = legal / audit truth

Analysis = derived, changeable, configurable

Reports = exportable views on top of both

This is enterprise-correct.

✅ REPORTS vs ANALYSIS vs STATUS (CLEAR DISTINCTION)
1️⃣ Order Slip Status (Immutable, Audit-Grade)

Source: Status Event Ledger
Nature: Append-only
Editable: ❌ Never

Includes:

Master Status Ledger

Status Summary

Supplier Reliability

Fraud Alerts

Aging

👉 Used for:

Audits

Disputes

Supplier escalations

Compliance

2️⃣ Analysis (Derived, Configurable)

Source: Status Ledger + PPO/REP data
Nature: Derived views
Editable: ❌ (logic configurable by Admin)

Includes all possible analyses, such as:

Pending Analysis

Pending by Product

Pending by Supplier

Pending by Category/Subcategory

Pending Value (MRP × Req Qty)

Pending Aging (pre-slip)

REP Analysis

REP Done vs Not Done

Supplier concentration

REP workload (count / value)

REP turnaround time

Funnel Analysis

Pending → REP Done → Slipped

Qty-based funnel

Count-based funnel

Order Slip Analysis

Slip qty by supplier

Slip qty by item

Invoice-wise aggregation

Manual vs Auto patterns (future)

Exception Analysis

% bad lines by supplier

Repeat damaged items

High pending suppliers

Status override frequency

👉 Analysis can grow without touching core logic.

3️⃣ Reports (Exports)

Reports are format-focused, not logic-focused:

Excel / PDF exports

Date-range driven

Filtered views of:

Status

Analysis

PPO / REP snapshots

Reports never mutate data.

✅ DATABASE MANAGEMENT SYSTEM (MASTERS)

Now the DBMS layer you asked for. This is critical.

1️⃣ SUPPLIERS MASTER (CRU by Admin)
Table: suppliers
Field	Type	Notes
id	UUID (PK)	
supplier_code	VARCHAR	Optional
supplier_name	VARCHAR	Unique
contact_person	VARCHAR	
mobile	VARCHAR	
email	VARCHAR	
gst_number	VARCHAR	
address	TEXT	
credit_days	INT	
active	BOOLEAN	
created_by	UUID	
created_at	TIMESTAMP	
updated_by	UUID	
updated_at	TIMESTAMP	
Rules

No hard delete

Inactive suppliers cannot be selected in REP

Supplier name snapshot is stored in slips/status (for audit)

2️⃣ PRODUCTS MASTER (Synced with ERP)
Table: products
Field	Type	Notes
id	UUID (PK)	ERP product ID
product_code	VARCHAR	
item_name	VARCHAR	Canonical
packing	VARCHAR	
category	VARCHAR	
subcategory	VARCHAR	
mrp	DECIMAL	
active	BOOLEAN	
created_at	TIMESTAMP	
updated_at	TIMESTAMP	

🚫 PPO never edits product core data
✅ PPO only references product_id

3️⃣ ITEM NAME CHANGE MASTER (Very Important)

This solves a long-term data integrity problem.

Table: product_name_changes
Field	Type	Notes
id	UUID (PK)	
product_id	UUID (FK)	
old_name	VARCHAR	
new_name	VARCHAR	
supplier_id	UUID (FK)	Optional
reason	TEXT	
effective_from	DATE	
effective_to	DATE	Nullable
active	BOOLEAN	
created_by	UUID	
created_at	TIMESTAMP	
Rules

Used to auto-suggest ITEM NAME CHANGE in REP

Slip uses:

Manual change > Active name change > Product name

Historical slips keep their snapshot

This is enterprise-grade correctness.

4️⃣ REP MASTER
Table: rep_master
Field	Type
id	UUID
name	VARCHAR
mobile	VARCHAR
email	VARCHAR
designation	VARCHAR
active	BOOLEAN
created_by	UUID
created_at	TIMESTAMP
updated_at	TIMESTAMP

Used for:

REP assignment

Analytics

Accountability

5️⃣ USERS & ROLES
Table: users
Field	Type
id	UUID
email	VARCHAR (unique)
name	VARCHAR
role	ENUM
active	BOOLEAN
created_at	TIMESTAMP

Roles:

SUPER_ADMIN

ADMIN

PROCUREMENT_HEAD

PURCHASE_STAFF

BILLING_HEAD

BILLING_STAFF

6️⃣ DUTY SESSIONS (Billing Control)
Table: duty_sessions
Field	Type
id	UUID
user_id	UUID
start_time	TIMESTAMP
end_time	TIMESTAMP
active	BOOLEAN

Linked to:

Status events

Overrides

Accountability

✅ SYSTEM SETTINGS (ADMIN)
Table: system_settings
Key	Example
slip_generation_time	16:00
fraud_bad_qty_threshold	10
fraud_pending_threshold	20
allow_supplier_change_in_rep	true

Configurable without code changes.



PART 1 — SCREEN-BY-SCREEN WIREFRAMES

(ASCII / Figma-ready, exact structure & behavior)

These are layout + interaction wireframes, not visuals.
A Figma designer can translate this 1:1.

GLOBAL LAYOUT (ALL SCREENS)
┌───────────────────────────────────────────────┐
│ Sahakar PPO                                   │
│ [ Duty End ]           Logged in: <Name>      │
├───────────────┬───────────────────────────────┤
│ Sidebar       │ Main Content Area              │
│               │                               │
│ Dashboard     │                               │
│ PPO           │                               │
│ Order Slips   │                               │
│ Order Slip    │                               │
│ Status        │                               │
│ Analysis      │                               │
│ Masters       │                               │
│ Audit & Logs  │                               │
└───────────────┴───────────────────────────────┘


Duty End button visible only to Billing roles

Sidebar items appear based on role

Main content is always table-first

1️⃣ PPO INPUT (IMPORT)
Header: PPO Input

[ Upload Excel File ]

---------------------------------------------
| File Preview (Read-only table)            |
---------------------------------------------
| Accept Date | Order ID | Product | Qty ...|
---------------------------------------------

[ Validate ]   [ Process Orders ]

---------------------------------------------
| Duplicate Report (if any)                 |
---------------------------------------------
| Order ID | Product ID | Reason             |
---------------------------------------------


Rules

No editing

Validate shows duplicates

Process Orders = irreversible append + aggregation

2️⃣ PENDING PURCHASE ORDERS (PPO)
Header: Pending Purchase Orders

Filters:
[ Supplier ▼ ] [ Category ▼ ] [ Subcategory ▼ ]
[ Date ▼ ]     [ REP ▼ ]      [ Status ▼ ]

---------------------------------------------------------------
| PROD | ITEM | REQ QTY | NOTES | SUPPLIER | DONE | ACTIONS   |
---------------------------------------------------------------
| 101  | XYZ  | 120     | ...   | ABC      | [ ]  | [→ REP]   |
---------------------------------------------------------------


Interactions

NOTES = allocator distribution (read-only)

DONE checkbox enables “→ REP”

Row becomes blurred/hidden after move

No quantity edits here

3️⃣ REP ORDERS (PROCUREMENT HEAD)
Header: REP Orders

Filters:
[ Supplier ▼ ] [ REP ▼ ] [ Status ▼ ]

---------------------------------------------------------------------------
| PROD | ITEM | REQ QTY | NOTES | ORDERED SUP | REP | DONE | ACTIONS       |
---------------------------------------------------------------------------
| 101  | XYZ  | 120     | ...   | ABC PHARMA  | R1  | [ ]  | [Return]      |
---------------------------------------------------------------------------


Actions

Change ORDERED SUPPLIER

Edit NOTES (procurement notes only)

DONE → eligible for Order Slip

Return to Pending (before slip gen only)

4️⃣ ORDER SLIPS (BILLING)
Header: Order Slips – Today

Supplier: ABC PHARMA      Date: 2026-01-12

----------------------------------------------------------------------------
| CUST | ORDER | ITEM | QTY | STATUS ▼ | INVOICE | NOTES | ACTION |
----------------------------------------------------------------------------
| C01  | O12   | XYZ  | 10  | BILLED   |         |       | ✓      |
----------------------------------------------------------------------------


Status Popup (example: PARTIALLY BILLED)

PARTIALLY BILLED
----------------
Invoice ID: [________]
Billed Qty: [__]
Pending Qty: [__]

[ Confirm ]


Editable until Duty End

Billing Head can override with reason

5️⃣ ORDER SLIP STATUS (AUDIT)
Header: Master Status Ledger

Filters:
[ Supplier ▼ ] [ Status ▼ ] [ Date Range ]

---------------------------------------------------------------------------
| Date | Supplier | Order | Item | Status | Qty | Invoice | By |
---------------------------------------------------------------------------


Read-only

Export allowed

Drill-down to event history

6️⃣ ANALYSIS DASHBOARD
Header: Analysis

[ Pending Analysis ] [ REP Analysis ] [ Funnel ] [ Exceptions ]

---------------------------------------------------
| Chart / Table                                   |
---------------------------------------------------


No edits

All derived

Filters affect all widgets

7️⃣ MASTERS (DB MANAGEMENT)
Suppliers
[ + Add Supplier ]

| Name | Mobile | GST | Active | Edit |

Products
| Product ID | Item Name | Packing | Active |

Item Name Changes
| Product | Old Name | New Name | Supplier | Active |

REP Master / Users

Standard CRUD, audit-logged.

PART 2 — BACKGROUND JOB & SCHEDULER DESIGN

(Replacement for Apps Script triggers)

CORE PRINCIPLE

No UI action performs heavy logic directly

Everything critical is:

Event-driven

Idempotent

Lock-safe

JOB TYPES
1️⃣ Order Processing Job

Triggered by: PPO Input → Process Orders

Aggregate product-level demand

Classify NA / Stock / Active

Append to Pending

Acquire lock: process_orders:<date>

2️⃣ Order Slip Generation Job

Triggered by:

Admin manual click OR

Scheduled time (from system settings)

Rules

Once per day

Supplier-wise

DONE = true only

Idempotent key: slip:<supplier>:<date>

3️⃣ Status Analytics Job

Triggered by:

Every new Status Event

Nightly full rebuild (safety)

Builds:

Master Status

Supplier reliability

Fraud alerts

Aging

4️⃣ Fraud & Anomaly Job

Scheduled: Nightly

Uses thresholds from settings

Generates alert records

Non-blocking

5️⃣ Duty Session Finalizer

Triggered by: Duty End button

Locks rows edited in that session

Prevents further changes

TECHNOLOGY

Queue: BullMQ (Redis)

Scheduler: Cron + queue

Locks: DB advisory locks + idempotency keys

Retries: Safe retry (jobs are idempotent)

PART 3 — MIGRATION PLAYBOOK (SHEETS → WEB)

This is critical. Follow this exactly.

PHASE 1 — EXPORT (READ-ONLY)

Export these sheets as Excel/CSV:

PPO INPUT

MASTER LOG

DAILY PENDING

DAILY REP

ORDER SLIPS

ORDER SLIP STATUS

ANALYSIS (for validation only)

PHASE 2 — TRANSFORMATION
Mapping Rules
Sheet	Target
PPO Input	order_requests
Pending	pending_items
REP	rep_items
Order Slips	order_slips + slip_items
Status	status_events

Preserve IDs where possible

Generate hashes to detect duplicates

Normalize supplier & product references

PHASE 3 — IMPORT (DRY RUN)

Import into staging DB

Generate:

Pending totals

Status counts

Compare with Sheets outputs

Fix mismatches

PHASE 4 — PARALLEL RUN (MANDATORY)

Duration: 2–4 weeks

Sheets = source of truth

Web app = read-only + shadow analytics

Compare daily:

Pending counts

Slip totals

Status distribution

PHASE 5 — CUTOVER

Freeze Sheets (read-only)

Final delta import

Enable web write access

Disable Apps Script triggers

Take backup

PHASE 6 — POST-GO-LIVE SAFETY

Enable nightly reconciliation

Enable audit exports

Lock DB deletes permanently



✅ FINAL CLARIFICATION (LOCKED)
Terminology (Very Important)

PPO Pending Order (PO) = Pending Purchase Order stage

REP Order = Post-PO, supplier-facing preparation stage

So from now on, we use:

PO / PPO Pending → has quantities + allocator

REP → no quantities, no allocator

This matches your real operation.

✅ CORRECT FINAL BEHAVIOR BY STAGE
🟡 PPO PENDING ORDER (PO) — Allocator Stage

This stage DOES HAVE quantities and allocator.

PPO Pending Order includes:

REQ QTY (from input, read-only)

ORDERED QTY

STOCK QTY

OFFER QTY

ALLOCATOR

Generates customer-wise split

Produces structured NOTES

DECIDED SUPPLIER

DONE / Change to REP

✅ Allocator lives here
✅ Quantities live here
✅ Supplier decision lives here

This is the only stage where quantity math happens.

🟢 REP ORDER — NO Allocator, NO Quantities

REP is purely supplier-side preparation.

REP does NOT have:

Ordered Qty ❌

Stock Qty ❌

Offer Qty ❌

Allocator ❌

REP ONLY has:

Product identity

REQ QTY (read-only reference)

NOTES (copied from PO allocator)

ORDERED SUPPLIER (can be changed)

ITEM NAME CHANGE

Procurement NOTES

DONE → eligible for Order Slip

Return to Pending (before slip)

This aligns with what you already locked earlier.

🔁 UPDATED CANONICAL WORKFLOW (FINAL)
INPUT
  ↓
PPO PENDING ORDER (PO)
  - Ordered / Stock / Offer Qty
  - Allocator runs
  - Notes generated
  - Supplier decided
  ↓ DONE
REP
  - No quantities
  - No allocator
  - Supplier preparation
  ↓ DONE
ORDER SLIP
  - Billing execution
  ↓
STATUS EVENTS
  ↓
STATUS & ANALYSIS

📌 WHAT NEEDS TO BE FIXED IN YOUR DOCUMENT
1️⃣ Business Workflow Section

✅ Keep Ordered / Stock / Offer Qty in Stage 2 (Pending PO)
❌ Remove any mention of these in REP

2️⃣ UI / UX Sections

Pending PPO screen → quantities + allocator ✔️

REP screen → no quantities, no allocator ✔️

3️⃣ Database Design (Very Important)

Update schema like this:

pending_items (PO stage)

✅ Keep:

ordered_qty

stock_qty

offer_qty

allocator_notes

decided_supplier

rep_items

❌ Remove:

ordered_qty

stock_qty

offer_qty

allocator fields

✅ Keep:

req_qty (reference)

notes (copied allocator output)

ordered_supplier

item_name_change

done flag

This cleanly separates responsibilities.

🔒 FINAL LOCK (VERY IMPORTANT)

After this clarification, the following is now fully locked and correct:

Allocator exists only in PPO Pending Order

Quantities exist only in PPO Pending Order

REP is quantity-less

REP is allocator-less

Notes flow: PO → REP → Order Slip

Billing never recalculates quantities

This is architecturally sound, auditor-friendly, and developer-safe.

✅ VERDICT

Yes — with this clarification, your document is conceptually correct.

It just needs:

Minor wording fixes

Schema alignment

Clear PO vs REP separation (now done


Sahakar PPO Web Application
Authoritative System Design & Architecture Documentation (v1.0 – FINAL)
1. EXECUTIVE OVERVIEW
1.1 What the System Does

The Sahakar PPO Web Application is a transaction-critical procurement orchestration system that manages the complete lifecycle of pharmacy purchase orders, starting from raw outlet order ingestion through procurement planning, supplier execution, billing reconciliation, and audit-grade analytics.

It replaces an existing Google Sheets + Google Apps Script–based PPO system, while preserving 100% of the original business logic, workflows, validations, and audit behavior.

This system is not greenfield and does not redesign operations.
It formalizes and hardens an already proven workflow.

1.2 Why the System Exists

The Sheets-based system has reached its architectural ceiling:

High operational risk from manual edits

No transactional integrity or rollback guarantees

Apps Script acting as an unreliable backend

Poor concurrency control

Difficult auditing and dispute resolution

Performance degradation as data volume grows

The web application exists to:

Establish a single, authoritative system of record

Enforce deterministic workflows

Guarantee immutability where required

Enable scale, audits, disputes, and future integrations

1.3 Problems It Solves

Eliminates accidental data corruption

Guarantees immutable audit trails

Preserves human overrides with full traceability

Replaces script triggers with event-driven workflows

Enables ERP, accounting, and BI integrations

Provides a legally defensible data model

2. BUSINESS WORKFLOW MAP
2.1 Canonical High-Level Flow
INPUT
  ↓
PPO PENDING ORDER (PO)
  ↓ (Procurement decision + allocator)
REP
  ↓ (Supplier preparation)
ORDER SLIP
  ↓ (Billing execution)
STATUS EVENTS
  ↓
STATUS & ANALYSIS

2.2 Detailed Workflow & State Transitions
Stage 1: PPO Input (Order Ingestion)

Actor: System / HO Operations
Source: ERP-generated Excel file (manual upload)

Behavior:

Orders are ingested exactly as provided

No user editing

Each row includes:

Accept date & time

Customer ID

Order ID

Product ID & name

Requested quantity

Supplier hints

Each row is hashed using (Order ID + Product ID + Date)

Duplicate hashes are detected and reported

All rows are logged immutably

State: RAW_INGESTED

Stage 2: PPO Pending Order (PO)

(Allocator & Quantity Stage)

Actor: HO Procurement / Purchase Staff
Purpose: Procurement planning & decision making

This is the only stage where quantities and allocator logic exist.

Characteristics

Data is product-level aggregated

Customer-level details exist only inside allocator notes

Rows are editable until moved to REP

Editable Fields

ORDERED QTY

STOCK QTY

OFFER QTY

DECIDED SUPPLIER

ALLOCATOR OUTPUT (NOTES) (via allocator UI)

DONE / Change to REP

Allocator

Splits REQ QTY across customers/orders

Generates structured NOTES:

Ord 1023: 5(Buy), 3(Stk)
Ord 1024: 10(Buy), 2(Off)


NOTES are system-generated only

Transitions

PO → REP (DONE)

PO → NA

PO → BILLED (Stock)

Once moved:

PO row becomes locked & hidden

Same record is reactivated if returned from REP (no cloning)

Stage 3: REP (Supplier Preparation Stage)

Actor: Procurement Head
Purpose: Supplier-side preparation before order execution

This stage is explicitly quantity-less.

Characteristics

No allocator

No quantity math

No stock / offer / ordered qty

Editable Fields

ORDERED SUPPLIER (can be changed with audit)

ITEM NAME CHANGE

PROCUREMENT NOTES

REP reference

DONE (Change to PO / eligible for slip)

Rules

Supplier can be changed

All changes are audited

Return to Pending allowed before slip generation

After slip generation → immutable

Stage 4: Order Slip Generation

Actor: Admin (manual) + Scheduler
Purpose: Supplier-wise execution document

Rules

Generated once per day

Time configurable in system settings

One slip per supplier per day

Includes only:

REP rows with DONE = true

No regeneration

No partial supplier slips

State: SLIP_GENERATED

Stage 5: Order Slip Execution (Billing)

Actor: Billing Staff / Billing Head
Purpose: Capture what actually happened at supplier billing

Allowed Statuses

BILLED

NOT BILLED

PARTIALLY BILLED

PRODUCT CHANGED

SUPPLIER ITEM DAMAGED

SUPPLIER ITEM MISSING

Rules

Status change requires popup validation

Invoice ID mandatory for:

PRODUCT CHANGED

SUPPLIER ITEM DAMAGED

SUPPLIER ITEM MISSING

PARTIALLY BILLED

Status editable until Duty End

Billing Head can override with reason

Every action generates an immutable status event

Stage 6: Status Ledger & Analysis

Actor: System / Management
Purpose: Audit, dispute resolution, analytics

Derived outputs:

Master Status Ledger

Supplier reliability

Aging

Fraud alerts

Funnel & exception analytics

3. DOMAIN MODEL
3.1 Core Entities

OrderRequest

PendingItem (PO)

RepItem

OrderSlip

OrderSlipItem

StatusEvent

Supplier

Product

ProductNameChange

RepMaster

User

Role

AuditEvent

DutySession

3.2 Ownership & Mutability
Entity	Mutable	Owner
OrderRequest	❌	System
PendingItem (PO)	✅ (limited)	Procurement
RepItem	✅ (limited)	Procurement Head
OrderSlip	❌	System
OrderSlipItem	✅ (status only)	Billing
StatusEvent	❌	System
AuditEvent	❌	System
4. DATABASE DESIGN (RELATIONAL – FINAL)
4.1 Core Tables (Corrected)
order_requests

id (PK)

accept_datetime

customer_id

order_id

product_id

product_name

packing

category

subcategory

primary_supplier

secondary_supplier

rep

mobile

mrp

req_qty

hash (UNIQUE)

created_at

pending_items (PO Stage)

id (PK)

product_id

req_qty

ordered_qty

stock_qty

offer_qty

allocator_notes

decided_supplier

done

state

created_at

rep_items

id (PK)

pending_item_id (FK)

ordered_supplier

item_name_change

procurement_notes

rep_id

done

state

created_at

order_slips

id (PK)

supplier_id

slip_date

created_at

order_slip_items

id (PK)

order_slip_id (FK)

customer_id

order_id

item_name_snapshot

qty

status

invoice_id

created_at

status_events (IMMUTABLE)

id (PK)

slip_item_id

status

qty_received

qty_bad

qty_pending

invoice_id

reason

actor_id

duty_session_id

created_at

audit_events (IMMUTABLE)

id (PK)

entity_type

entity_id

action

before_state (JSONB)

after_state (JSONB)

actor_id

created_at

5. TECH STACK (FINAL)

Frontend: Next.js (TypeScript)

Backend: NestJS (TypeScript)

Database: PostgreSQL

Queue: Redis + BullMQ

Auth: Firebase Auth + DB RBAC

Hosting:

API → GCP Cloud Run

Web → Vercel

Storage: GCS

PDF: Server-side

6. UI / UX MODULES (FINAL)

PPO Input

PPO Pending Orders (PO)

REP Orders

Order Slips (Billing)

Order Slip Status

Analysis

Masters

Audit & Logs

UX Constraints

Spreadsheet-like grids

Mandatory confirmations

Zero silent failures

Read-only history

7. EVENT & WORKFLOW ENGINE

All writes → DB transaction + audit event

Status change → status event

Background jobs replace Apps Script

Idempotent, lock-safe execution

8. LOGGING, AUDIT & COMPLIANCE

Append-only logs

No hard deletes

User identity on every action

Duty session accountability

Audit-ready by design

9. MIGRATION STRATEGY (LOCKED)

Export Sheets (read-only)

Transform to canonical schema

Dry-run import

Parallel run (2–4 weeks)

Reconciliation

Cutover

Disable Apps Script

10. NON-FUNCTIONAL REQUIREMENTS

Correctness > speed

ACID transactions

Strong indexing

Horizontal scalability

Zero data loss

FINAL AUDITOR NOTE

This system is not a CRUD app.
It is a financially and operationally sensitive transaction engine.

This v1.0 specification is:

Internally consistent

Fully aligned with real operations

Safe for audits, disputes, and scale