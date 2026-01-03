-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "supplier_code" TEXT,
    "supplier_name" TEXT NOT NULL,
    "contact_person" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "gst_number" TEXT,
    "address" TEXT,
    "credit_days" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "product_code" TEXT,
    "item_name" TEXT NOT NULL,
    "packing" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "mrp" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_name_changes" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "old_name" TEXT,
    "new_name" TEXT NOT NULL,
    "reason" TEXT,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_name_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rep_master" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "designation" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rep_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppo_input_files" (
    "id" TEXT NOT NULL,
    "original_filename" TEXT,
    "uploaded_by" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_hash" TEXT,
    "total_rows" INTEGER,
    "duplicate_rows" INTEGER,

    CONSTRAINT "ppo_input_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_requests" (
    "id" TEXT NOT NULL,
    "input_file_id" TEXT,
    "accept_date" DATE,
    "accept_time" TIME,
    "customer_id" TEXT,
    "order_id" TEXT,
    "product_id" TEXT,
    "product_name_snapshot" TEXT,
    "req_qty" INTEGER,
    "mrp" DECIMAL(10,2),
    "primary_supplier" TEXT,
    "secondary_supplier" TEXT,
    "hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po_pending_items" (
    "id" TEXT NOT NULL,
    "product_id" TEXT,
    "total_req_qty" INTEGER NOT NULL,
    "ordered_qty" INTEGER NOT NULL DEFAULT 0,
    "stock_qty" INTEGER NOT NULL DEFAULT 0,
    "offer_qty" INTEGER NOT NULL DEFAULT 0,
    "allocator_notes" TEXT,
    "decided_supplier_id" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "moved_to_rep" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "po_pending_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rep_orders" (
    "id" TEXT NOT NULL,
    "po_pending_id" TEXT,
    "product_id" TEXT,
    "req_qty" INTEGER NOT NULL,
    "notes" TEXT,
    "item_name_change" TEXT,
    "ordered_supplier_id" TEXT,
    "rep_id" TEXT,
    "mobile" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "returned_to_pending" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rep_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_slips" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "slip_date" DATE NOT NULL,
    "generated_by" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "regenerated_from" TEXT,

    CONSTRAINT "order_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_slip_items" (
    "id" TEXT NOT NULL,
    "order_slip_id" TEXT,
    "customer_id" TEXT,
    "order_id" TEXT,
    "product_id" TEXT,
    "item_name_snapshot" TEXT,
    "qty" INTEGER NOT NULL,
    "remarks" TEXT,
    "current_status" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_slip_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duty_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "duty_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_events" (
    "id" TEXT NOT NULL,
    "order_slip_item_id" TEXT,
    "event_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "ordered_qty" INTEGER,
    "received_qty" INTEGER,
    "damaged_qty" INTEGER,
    "missing_qty" INTEGER,
    "pending_qty" INTEGER,
    "invoice_id" TEXT,
    "old_item_name" TEXT,
    "new_item_name" TEXT,
    "notes" TEXT,
    "performed_by" TEXT,
    "duty_session_id" TEXT,
    "override" BOOLEAN NOT NULL DEFAULT false,
    "override_reason" TEXT,

    CONSTRAINT "status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "action" TEXT,
    "before_state" JSONB,
    "after_state" JSONB,
    "performed_by" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_mutations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "base_version" INTEGER,
    "payload" JSONB,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offline_mutations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflicts" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "local_payload" JSONB,
    "server_payload" JSONB,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution" TEXT,
    "resolution_reason" TEXT,

    CONSTRAINT "conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_supplier_name_key" ON "suppliers"("supplier_name");

-- CreateIndex
CREATE UNIQUE INDEX "ppo_input_files_file_hash_key" ON "ppo_input_files"("file_hash");

-- CreateIndex
CREATE UNIQUE INDEX "order_requests_hash_key" ON "order_requests"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "order_slips_supplier_id_slip_date_key" ON "order_slips"("supplier_id", "slip_date");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_name_changes" ADD CONSTRAINT "product_name_changes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_name_changes" ADD CONSTRAINT "product_name_changes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_name_changes" ADD CONSTRAINT "product_name_changes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rep_master" ADD CONSTRAINT "rep_master_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppo_input_files" ADD CONSTRAINT "ppo_input_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_requests" ADD CONSTRAINT "order_requests_input_file_id_fkey" FOREIGN KEY ("input_file_id") REFERENCES "ppo_input_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_requests" ADD CONSTRAINT "order_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_pending_items" ADD CONSTRAINT "po_pending_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_pending_items" ADD CONSTRAINT "po_pending_items_decided_supplier_id_fkey" FOREIGN KEY ("decided_supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_pending_items" ADD CONSTRAINT "po_pending_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rep_orders" ADD CONSTRAINT "rep_orders_po_pending_id_fkey" FOREIGN KEY ("po_pending_id") REFERENCES "po_pending_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rep_orders" ADD CONSTRAINT "rep_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rep_orders" ADD CONSTRAINT "rep_orders_ordered_supplier_id_fkey" FOREIGN KEY ("ordered_supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rep_orders" ADD CONSTRAINT "rep_orders_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "rep_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rep_orders" ADD CONSTRAINT "rep_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_slips" ADD CONSTRAINT "order_slips_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_slips" ADD CONSTRAINT "order_slips_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_slips" ADD CONSTRAINT "order_slips_regenerated_from_fkey" FOREIGN KEY ("regenerated_from") REFERENCES "order_slips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_slip_items" ADD CONSTRAINT "order_slip_items_order_slip_id_fkey" FOREIGN KEY ("order_slip_id") REFERENCES "order_slips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_slip_items" ADD CONSTRAINT "order_slip_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty_sessions" ADD CONSTRAINT "duty_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_events" ADD CONSTRAINT "status_events_order_slip_item_id_fkey" FOREIGN KEY ("order_slip_item_id") REFERENCES "order_slip_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_events" ADD CONSTRAINT "status_events_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_events" ADD CONSTRAINT "status_events_duty_session_id_fkey" FOREIGN KEY ("duty_session_id") REFERENCES "duty_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_mutations" ADD CONSTRAINT "offline_mutations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
