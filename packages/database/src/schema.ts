import { pgTable, uuid, varchar, text, boolean, timestamp, integer, numeric, pgEnum, date } from 'drizzle-orm/pg-core';

// ========================================
// ENUMS
// ========================================

export const roleEnum = pgEnum('role', [
    'SUPER_ADMIN',
    'ADMIN',
    'PROCUREMENT_HEAD',
    'PURCHASE_STAFF',
    'BILLING_HEAD',
    'BILLING_STAFF'
]);

export const orderStageEnum = pgEnum('order_stage', [
    'RAW_INGESTED',
    'PENDING',
    'REP_ALLOCATION',
    'SLIP_GENERATED',
    'EXECUTED'
]);

export const itemStatusEnum = pgEnum('item_status', [
    'PENDING',
    'BILLED',
    'NOT_BILLED',
    'PARTIALLY_BILLED',
    'PRODUCT_CHANGED',
    'SUPPLIER_ITEM_DAMAGED',
    'SUPPLIER_ITEM_MISSING'
]);

export const pendingStateEnum = pgEnum('pending_state', [
    'PENDING',
    'LOCKED',
    'MOVED_TO_REP',
    'SLIPPED'
]);

export const repStateEnum = pgEnum('rep_state', [
    'REP_ACTIVE',
    'READY_FOR_SLIP',
    'SLIPPED'
]);

// ========================================
// 1. USERS & ACCESS CONTROL
// ========================================

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    role: roleEnum('role').notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const dutySessions = pgTable('duty_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    startTime: timestamp('start_time').defaultNow().notNull(),
    endTime: timestamp('end_time'),
    active: boolean('active').default(true).notNull()
});

// ========================================
// 2. MASTER DATA
// ========================================

export const suppliers = pgTable('suppliers', {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierCode: varchar('supplier_code', { length: 50 }),
    supplierName: varchar('supplier_name', { length: 255 }).notNull().unique(),
    contactPerson: varchar('contact_person', { length: 255 }),
    mobile: varchar('mobile', { length: 20 }),
    email: varchar('email', { length: 255 }),
    gstNumber: varchar('gst_number', { length: 50 }),
    address: text('address'),
    creditDays: integer('credit_days'),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const products = pgTable('products', {
    id: uuid('id').primaryKey().defaultRandom(),
    legacyId: varchar('legacy_id', { length: 50 }).unique(),
    productCode: varchar('product_code', { length: 50 }),
    itemName: varchar('item_name', { length: 500 }).notNull(),
    packing: varchar('packing', { length: 100 }),
    category: varchar('category', { length: 100 }),
    subcategory: varchar('subcategory', { length: 100 }),
    mrp: numeric('mrp', { precision: 10, scale: 2 }),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const productNameChanges = pgTable('product_name_changes', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').references(() => products.id).notNull(),
    supplierId: uuid('supplier_id').references(() => suppliers.id),
    oldName: varchar('old_name', { length: 500 }),
    newName: varchar('new_name', { length: 500 }).notNull(),
    reason: text('reason'),
    effectiveFrom: date('effective_from'),
    effectiveTo: date('effective_to'),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

export const repMaster = pgTable('rep_master', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    mobile: varchar('mobile', { length: 20 }),
    email: varchar('email', { length: 255 }),
    designation: varchar('designation', { length: 100 }),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ========================================
// 3. PPO INPUT (IMMUTABLE)
// ========================================

export const orderRequests = pgTable('order_requests', {
    id: uuid('id').primaryKey().defaultRandom(),
    acceptDatetime: timestamp('accept_datetime'),
    customerId: varchar('customer_id', { length: 100 }),
    orderId: varchar('order_id', { length: 100 }),
    productId: uuid('product_id').references(() => products.id),
    productName: varchar('product_name', { length: 500 }),
    packing: varchar('packing', { length: 100 }),
    category: varchar('category', { length: 100 }),
    subcategory: varchar('subcategory', { length: 100 }),
    primarySupplier: varchar('primary_supplier', { length: 255 }),
    secondarySupplier: varchar('secondary_supplier', { length: 255 }),
    rep: varchar('rep', { length: 255 }),
    mobile: varchar('mobile', { length: 20 }),
    mrp: numeric('mrp', { precision: 10, scale: 2 }),
    reqQty: integer('req_qty'),
    legacyProductId: varchar('legacy_product_id', { length: 50 }),
    customerName: varchar('customer_name', { length: 255 }),
    acceptedTime: varchar('accepted_time', { length: 20 }),
    oQty: integer('o_qty'),
    cQty: integer('c_qty'),
    modification: varchar('modification', { length: 100 }),
    stage: varchar('stage', { length: 50 }),
    hash: varchar('hash', { length: 64 }).unique(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

// ========================================
// 4. PPO PENDING (PO STAGE)
// ========================================

export const pendingItems = pgTable('pending_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').references(() => products.id),
    reqQty: integer('req_qty').notNull(),
    orderedQty: integer('ordered_qty').default(0).notNull(),
    stockQty: integer('stock_qty').default(0).notNull(),
    offerQty: integer('offer_qty').default(0).notNull(),
    allocatorNotes: text('allocator_notes'),
    decidedSupplierId: uuid('decided_supplier_id').references(() => suppliers.id),
    done: boolean('done').default(false).notNull(),
    locked: boolean('locked').default(false).notNull(),
    state: pendingStateEnum('state').default('PENDING').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ========================================
// 5. REP STAGE (BULK PROCUREMENT)
// ========================================

export const repItems = pgTable('rep_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    pendingItemId: uuid('pending_item_id').references(() => pendingItems.id),
    productId: uuid('product_id').references(() => products.id),
    reqQty: integer('req_qty').notNull(),
    notes: text('notes'),
    itemNameChange: varchar('item_name_change', { length: 500 }),
    orderedSupplierId: uuid('ordered_supplier_id').references(() => suppliers.id),
    repId: uuid('rep_id').references(() => repMaster.id),
    mobile: varchar('mobile', { length: 20 }),
    done: boolean('done').default(false).notNull(),
    state: repStateEnum('state').default('REP_ACTIVE').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

// ========================================
// 6. ORDER SLIPS
// ========================================

export const orderSlips = pgTable('order_slips', {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierId: uuid('supplier_id').references(() => suppliers.id),
    slipDate: date('slip_date').notNull(),
    generatedAt: timestamp('generated_at').defaultNow().notNull(),
    generatedBy: uuid('generated_by').references(() => users.id)
});

export const orderSlipItems = pgTable('order_slip_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderSlipId: uuid('order_slip_id').references(() => orderSlips.id),
    productId: uuid('product_id').references(() => products.id),
    itemNameSnapshot: varchar('item_name_snapshot', { length: 500 }),
    qty: integer('qty').notNull(),
    status: itemStatusEnum('status').default('PENDING').notNull(),
    invoiceId: varchar('invoice_id', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

// ========================================
// 7. STATUS & AUDIT (IMMUTABLE)
// ========================================

export const statusEvents = pgTable('status_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderSlipItemId: uuid('order_slip_item_id').references(() => orderSlipItems.id),
    status: varchar('status', { length: 100 }).notNull(),
    qtyReceived: integer('qty_received'),
    qtyDamaged: integer('qty_damaged'),
    qtyPending: integer('qty_pending'),
    invoiceId: varchar('invoice_id', { length: 100 }),
    notes: text('notes'),
    staffEmail: varchar('staff_email', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

export const auditEvents = pgTable('audit_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: varchar('entity_type', { length: 100 }),
    entityId: uuid('entity_id'),
    action: varchar('action', { length: 100 }),
    beforeState: text('before_state'), // JSONB stored as text
    afterState: text('after_state'), // JSONB stored as text
    actor: varchar('actor', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull()
});
