ALTER TABLE "order_requests" ADD COLUMN "legacy_product_id" varchar(50);--> statement-breakpoint
ALTER TABLE "order_requests" ADD COLUMN "customer_name" varchar(255);--> statement-breakpoint
ALTER TABLE "order_requests" ADD COLUMN "accepted_time" varchar(20);--> statement-breakpoint
ALTER TABLE "order_requests" ADD COLUMN "o_qty" integer;--> statement-breakpoint
ALTER TABLE "order_requests" ADD COLUMN "c_qty" integer;--> statement-breakpoint
ALTER TABLE "order_requests" ADD COLUMN "modification" varchar(100);--> statement-breakpoint
ALTER TABLE "order_requests" ADD COLUMN "stage" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "legacy_id" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_legacy_id_unique" UNIQUE("legacy_id");