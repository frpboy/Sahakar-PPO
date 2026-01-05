import { pgTable, bigint, varchar, text, boolean, timestamp, integer, numeric, date, jsonb, time, bigserial, unique } from 'drizzle-orm/pg-core';

// ========================================
// 1. PRODUCTS (from product list.xlsx)
// ========================================

export const products = pgTable('products', {
    id: bigint('id', { mode: 'bigint' }).primaryKey(),
    legacyId: text('legacy_id'),
    productCode: text('product_code'),
    name: text('name').notNull(),
    aliasName: text('alias_name'),

    primarySupplier: text('primary_supplier'),
    secondarySupplier: text('secondary_supplier'),
    leastPriceSupplier: text('least_price_supplier'),
    mostQtySupplier: text('most_qty_supplier'),

    category: text('category'),
    subCategory: text('sub_category'),
    genericName: text('generic_name'),
    patent: text('patent'),

    hsnCode: text('hsn_code'),
    productType: text('product_type'), // Type
    discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }),
    packing: integer('packing'),

    gstPercent: numeric('gst_percent', { precision: 5, scale: 2 }),
    stock: integer('stock').default(0),

    mrp: numeric('mrp', { precision: 10, scale: 2 }),
    ptr: numeric('ptr', { precision: 10, scale: 2 }),
    pt: numeric('pt', { precision: 10, scale: 2 }),
    localCost: numeric('local_cost', { precision: 10, scale: 2 }),

    createdDate: date('created_date'),
    rep: text('rep'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// ========================================
// 2. SUPPLIERS (from supplier list.xlsx)
// ========================================

export const suppliers = pgTable('suppliers', {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),

    area: text('area'),
    alias: text('alias').notNull(),

    mobile: text('mobile'),
    address: text('address'),
    city: text('city'),

    closingBalance: numeric('closing_balance', { precision: 12, scale: 2 }),
    balanceType: text('balance_type'), // 'Dr' or 'Cr'

    regNo: text('reg_no'),
    dlNo: text('dl_no'),
    gstNo: text('gst_no'),

    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// ========================================
// 3. PPO INPUT (from PPO - INPUT.xlsx)
// ========================================

export const ppoInput = pgTable('ppo_input', {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),

    acceptedDate: date('accepted_date'),
    acceptedTime: time('accepted_time'),

    customerId: bigint('customer_id', { mode: 'bigint' }),
    customerName: text('customer_name'),

    orderId: bigint('order_id', { mode: 'bigint' }),

    productId: bigint('product_id', { mode: 'bigint' }).references(() => products.id),
    productName: text('product_name'),

    packing: integer('packing'),
    subcategory: text('subcategory'),

    primarySupplier: text('primary_supplier'),
    secondarySupplier: text('secondary_supplier'),

    rep: text('rep'),
    mobile: text('mobile'),

    mrp: numeric('mrp', { precision: 10, scale: 2 }),

    orderQty: integer('order_qty'),
    confirmedQty: integer('confirmed_qty'),
    requestedQty: integer('requested_qty'),

    offer: text('offer'),
    stock: integer('stock'),
    rate: numeric('rate', { precision: 10, scale: 2 }),
    value: numeric('value', { precision: 12, scale: 2 }),
    status: text('status'),
    notes: text('notes'),
    remarks: text('remarks'),
    decidedSupplier: text('decided_supplier'),

    modification: text('modification'),
    stage: text('stage').default('Pending'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// ========================================
// 4. PENDING PO LEDGER
// ========================================

export const pendingPoLedger = pgTable('pending_po_ledger', {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),

    productId: bigint('product_id', { mode: 'bigint' }).references(() => products.id),

    reqQty: integer('req_qty'),
    orderedQty: integer('ordered_qty'),
    stockQty: integer('stock_qty'),
    offerQty: integer('offer_qty'),

    supplierPriority: jsonb('supplier_priority'), // ordered supplier list
    decidedSupplierName: text('decided_supplier_name'),
    allocationStatus: text('allocation_status'),
    remarks: text('remarks'),
    itemNameChange: text('item_name_change'),
    allocationDetails: text('allocation_details'),

    locked: boolean('locked').default(false),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// ========================================
// 5. REP ORDERS (atomic move target)
// ========================================

export const repOrders = pgTable('rep_orders', {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),

    productId: bigint('product_id', { mode: 'bigint' }),
    supplier: text('supplier'),

    qty: integer('qty'),
    rate: numeric('rate', { precision: 10, scale: 2 }),

    sourcePendingPoId: bigint('source_pending_po_id', { mode: 'bigint' }),
    status: text('status').default('PENDING'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// ========================================
// 6. ORDER SLIPS
// ========================================

export const orderSlips = pgTable('order_slips', {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),

    supplier: text('supplier'),
    slipDate: date('slip_date'),

    totalItems: integer('total_items'),
    totalValue: numeric('total_value', { precision: 12, scale: 2 }),

    remarks: text('remarks'),
    status: text('status').default('GENERATED'),
    displayId: text('display_id').unique(),
    billId: text('bill_id'),
    billDate: date('bill_date'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
    unq: unique().on(table.supplier, table.slipDate)
}));

export const orderSlipItems = pgTable('order_slip_items', {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    orderSlipId: bigint('order_slip_id', { mode: 'bigint' }).references(() => orderSlips.id),
    productId: bigint('product_id', { mode: 'bigint' }).references(() => products.id),
    qty: integer('qty').notNull(),
    rate: numeric('rate', { precision: 10, scale: 2 }),
    status: text('status').default('Pending'),
    invoiceId: text('invoice_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// ========================================
// 7. STATUS EVENTS
// ========================================

export const statusEvents = pgTable('status_events', {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),

    entityType: text('entity_type'), // PPO | REP | SLIP
    entityId: bigint('entity_id', { mode: 'bigint' }),

    oldStatus: text('old_status'),
    newStatus: text('new_status'),

    note: text('note'),
    createdBy: text('created_by'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// ========================================
// 8. AUDIT EVENTS
// ========================================

export const auditEvents = pgTable('audit_events', {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),

    actor: text('actor'),
    action: text('action'),
    entityType: text('entity_type'),
    entityId: bigint('entity_id', { mode: 'bigint' }),

    payload: jsonb('payload'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// ========================================
// 9. SYSTEM TABLES (Retained for Auth)
// ========================================

export const users = pgTable('users', {
    id: bigint('id', { mode: 'bigint' }).primaryKey(), // Using bigint for consistency if needed, but uuid was working for auth
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    role: text('role').notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const dutySessions = pgTable('duty_sessions', {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    userId: bigint('user_id', { mode: 'bigint' }).references(() => users.id),
    startTime: timestamp('start_time').defaultNow().notNull(),
    endTime: timestamp('end_time'),
    active: boolean('active').default(true).notNull(),
    updatedAt: timestamp('updated_at').defaultNow()
});

