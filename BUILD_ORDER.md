## SAHAKAR PPO WEB APPLICATION – OFFICIAL BUILD ORDER (STATEMENT OF WORK)

This document is a **formal execution order** to design, build, migrate, and deploy the Sahakar PPO Web Application based strictly on the attached Google Sheets + Apps Script system. This is NOT a conceptual document. This is an instruction set.

---

## 1. ORDER IDENTIFICATION

**Project Name:** Sahakar PPO Web Application
**Order Type:** Full System Rebuild (Sheets → Web App)
**Priority:** CRITICAL
**Tolerance for Logic Change:** ZERO

---

## 2. SOURCE OF TRUTH (NON-NEGOTIABLE)

The following files and scripts constitute the **authoritative system behavior**:

1. PPO – INPUT (Master Processing Engine)
2. PPO – Daily Pending Order
3. PPO – Daily Rep Order
4. PPO – Order Slips
5. PPO – Order Slip Status
6. PPO – PPO Analysis Engine

All workflows, validations, edge cases, triggers, logging behavior, and calculations present in these files **must be preserved exactly**.

If a rule exists in Apps Script, it MUST exist in the web application.

---

## 3. OBJECTIVE OF THIS ORDER

To design and implement a **production-grade, audit-safe, scalable web application** that:

* Replaces Google Sheets as the system of record
* Preserves every business rule and workflow
* Eliminates Apps Script triggers
* Introduces a relational database
* Supports future scale, audits, and integrations

---

## 4. SCOPE OF WORK (MANDATORY)

### 4.1 Functional Scope

The application MUST implement the following modules:

1. Order Intake & Cleaning (PPO Input equivalent)
2. Pending Order Management
3. Rep Allocation & Quantity Split
4. Order Slip Generation
5. Warehouse Status Handling (Billed / Partial / Missing / Damaged / Changed)
6. Central Status Ledger
7. Analysis, Dashboard, Fraud & Aging Reports
8. Immutable Logging & Audit Trail

No module may be skipped or merged.

---

### 4.2 Workflow Enforcement

The following flow MUST be enforced strictly:

Input → Pending → Rep → Slip → Status → Analysis

Backward movement is NOT allowed except via reversal events.

---

## 5. TECH STACK (ORDERED & FINAL)

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* TanStack Query
* Zod validation
* PWA support

### Backend

* Node.js (NestJS or Fastify)
* TypeScript
* Prisma ORM
* PostgreSQL (ONLY)
* Redis (locks + queues)
* BullMQ / Temporal (background workflows)

### Infrastructure

* Dockerized services
* Managed PostgreSQL
* Object storage for exports
* CI/CD pipeline

Firebase, NoSQL, or spreadsheet-backed persistence is **explicitly forbidden**.

---

## 6. DATABASE DIRECTIVES

1. PostgreSQL is the **single source of truth**
2. All status changes MUST be written as append-only events
3. No hard deletes on transactional data
4. All edits require actor + timestamp

Core tables MUST include:

* orders
* order_items
* suppliers
* ppo_items
* rep_allocations
* order_slips
* slip_lines
* status_events
* audit_logs

---

## 7. API & PERMISSION RULES

* UI must NEVER write directly to the database
* All changes go through authenticated APIs
* Role-based permissions are mandatory
* Idempotency is required for all write operations

Roles MUST include:

* Data Entry
* Manager
* Sales Rep
* Warehouse
* Admin

---

## 8. EVENT & AUTOMATION REPLACEMENT

All Google Apps Script triggers must be replaced by:

* API-driven state transitions
* Background workers
* Scheduled jobs (cron)

No hidden automation is allowed.

---

## 9. MIGRATION ORDER

1. Freeze existing Sheets logic
2. Export historical data
3. Normalize & validate
4. Import into PostgreSQL
5. Parallel run (Sheets vs App)
6. Final cutover

No data loss is acceptable.

---

## 10. QUALITY & ACCEPTANCE CRITERIA

The build will be considered COMPLETE only if:

* All current workflows behave identically
* Status transitions match existing logic
* Logs match or exceed current audit depth
* Reports match PPO Analysis outputs
* No sheet dependency remains

---

## 11. DELIVERY ARTEFACTS (MANDATORY)

1. System Architecture Document
2. Database Schema
3. API Specification
4. UI Wireflows
5. Migration Scripts
6. Deployment Guide
7. Runbook

---

## 12. EXECUTION RULE

This order must be followed exactly.

If any ambiguity arises, the **existing Apps Script behavior overrides all assumptions**.

No simplification. No optimization that changes outcomes. No skipped edge cases.

---

**END OF BUILD ORDER**
