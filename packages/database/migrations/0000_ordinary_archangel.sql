CREATE TYPE "public"."item_status" AS ENUM('PENDING', 'BILLED', 'NOT_BILLED', 'PARTIALLY_BILLED', 'PRODUCT_CHANGED', 'SUPPLIER_ITEM_DAMAGED', 'SUPPLIER_ITEM_MISSING');--> statement-breakpoint
CREATE TYPE "public"."order_stage" AS ENUM('RAW_INGESTED', 'PENDING', 'REP_ALLOCATION', 'SLIP_GENERATED', 'EXECUTED');--> statement-breakpoint
CREATE TYPE "public"."pending_state" AS ENUM('PENDING', 'LOCKED', 'MOVED_TO_REP', 'SLIPPED');--> statement-breakpoint
CREATE TYPE "public"."rep_state" AS ENUM('REP_ACTIVE', 'READY_FOR_SLIP', 'SLIPPED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_HEAD', 'PURCHASE_STAFF', 'BILLING_HEAD', 'BILLING_STAFF');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(100),
	"entity_id" uuid,
	"action" varchar(100),
	"before_state" text,
	"after_state" text,
	"actor" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duty_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accept_datetime" timestamp,
	"customer_id" varchar(100),
	"order_id" varchar(100),
	"product_id" uuid,
	"product_name" varchar(500),
	"packing" varchar(100),
	"category" varchar(100),
	"subcategory" varchar(100),
	"primary_supplier" varchar(255),
	"secondary_supplier" varchar(255),
	"rep" varchar(255),
	"mobile" varchar(20),
	"mrp" numeric(10, 2),
	"req_qty" integer,
	"hash" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_requests_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
CREATE TABLE "order_slip_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_slip_id" uuid,
	"product_id" uuid,
	"item_name_snapshot" varchar(500),
	"qty" integer NOT NULL,
	"status" "item_status" DEFAULT 'PENDING' NOT NULL,
	"invoice_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_slips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid,
	"slip_date" date NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"generated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "pending_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"req_qty" integer NOT NULL,
	"ordered_qty" integer DEFAULT 0 NOT NULL,
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"offer_qty" integer DEFAULT 0 NOT NULL,
	"allocator_notes" text,
	"decided_supplier_id" uuid,
	"done" boolean DEFAULT false NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"state" "pending_state" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_name_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"supplier_id" uuid,
	"old_name" varchar(500),
	"new_name" varchar(500) NOT NULL,
	"reason" text,
	"effective_from" date,
	"effective_to" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_code" varchar(50),
	"item_name" varchar(500) NOT NULL,
	"packing" varchar(100),
	"category" varchar(100),
	"subcategory" varchar(100),
	"mrp" numeric(10, 2),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rep_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pending_item_id" uuid,
	"product_id" uuid,
	"req_qty" integer NOT NULL,
	"notes" text,
	"item_name_change" varchar(500),
	"ordered_supplier_id" uuid,
	"rep_id" uuid,
	"mobile" varchar(20),
	"done" boolean DEFAULT false NOT NULL,
	"state" "rep_state" DEFAULT 'REP_ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rep_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"mobile" varchar(20),
	"email" varchar(255),
	"designation" varchar(100),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_slip_item_id" uuid,
	"status" varchar(100) NOT NULL,
	"qty_received" integer,
	"qty_damaged" integer,
	"qty_pending" integer,
	"invoice_id" varchar(100),
	"notes" text,
	"staff_email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_code" varchar(50),
	"supplier_name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"mobile" varchar(20),
	"email" varchar(255),
	"gst_number" varchar(50),
	"address" text,
	"credit_days" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_supplier_name_unique" UNIQUE("supplier_name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "duty_sessions" ADD CONSTRAINT "duty_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_requests" ADD CONSTRAINT "order_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_slip_items" ADD CONSTRAINT "order_slip_items_order_slip_id_order_slips_id_fk" FOREIGN KEY ("order_slip_id") REFERENCES "public"."order_slips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_slip_items" ADD CONSTRAINT "order_slip_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_slips" ADD CONSTRAINT "order_slips_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_slips" ADD CONSTRAINT "order_slips_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_items" ADD CONSTRAINT "pending_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_items" ADD CONSTRAINT "pending_items_decided_supplier_id_suppliers_id_fk" FOREIGN KEY ("decided_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_name_changes" ADD CONSTRAINT "product_name_changes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_name_changes" ADD CONSTRAINT "product_name_changes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_items" ADD CONSTRAINT "rep_items_pending_item_id_pending_items_id_fk" FOREIGN KEY ("pending_item_id") REFERENCES "public"."pending_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_items" ADD CONSTRAINT "rep_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_items" ADD CONSTRAINT "rep_items_ordered_supplier_id_suppliers_id_fk" FOREIGN KEY ("ordered_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_items" ADD CONSTRAINT "rep_items_rep_id_rep_master_id_fk" FOREIGN KEY ("rep_id") REFERENCES "public"."rep_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_events" ADD CONSTRAINT "status_events_order_slip_item_id_order_slip_items_id_fk" FOREIGN KEY ("order_slip_item_id") REFERENCES "public"."order_slip_items"("id") ON DELETE no action ON UPDATE no action;