ALTER TABLE "products" ADD COLUMN "alias_name" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "generic_name" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "patent" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "hsn_code" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "ptr" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "pts" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "landed_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "gst_percent" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "discount_percent" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "primary_supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "secondary_supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "least_price_supplier" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "most_qty_supplier" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rep_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_primary_supplier_id_suppliers_id_fk" FOREIGN KEY ("primary_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_secondary_supplier_id_suppliers_id_fk" FOREIGN KEY ("secondary_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_rep_id_rep_master_id_fk" FOREIGN KEY ("rep_id") REFERENCES "public"."rep_master"("id") ON DELETE no action ON UPDATE no action;