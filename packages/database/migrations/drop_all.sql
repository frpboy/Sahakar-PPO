-- Drop all existing tables and types from GCP Cloud SQL
-- This script will clean the database for fresh Drizzle migration

-- Drop all existing tables (CASCADE removes dependencies)
DROP TABLE IF EXISTS ppo_input_files CASCADE;
DROP TABLE IF EXISTS po_pending_items CASCADE;
DROP TABLE IF EXISTS rep_orders CASCADE;
DROP TABLE IF EXISTS order_slip_items CASCADE;
DROP TABLE IF EXISTS order_slips CASCADE;
DROP TABLE IF EXISTS system_events CASCADE;
DROP TABLE IF EXISTS offline_mutations CASCADE;
DROP TABLE IF EXISTS conflicts CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS duty_sessions CASCADE;
DROP TABLE IF EXISTS order_requests CASCADE;
DROP TABLE IF EXISTS pending_items CASCADE;
DROP TABLE IF EXISTS rep_items CASCADE;
DROP TABLE IF EXISTS product_name_changes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS rep_master CASCADE;
DROP TABLE IF EXISTS status_events CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop all existing enums
DROP TYPE IF EXISTS "ItemStatus" CASCADE;
DROP TYPE IF EXISTS "OrderStage" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "item_status" CASCADE;
DROP TYPE IF EXISTS "order_stage" CASCADE;
DROP TYPE IF EXISTS "pending_state" CASCADE;
DROP TYPE IF EXISTS "rep_state" CASCADE;
DROP TYPE IF EXISTS "role" CASCADE;
