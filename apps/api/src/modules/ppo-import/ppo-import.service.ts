import { Injectable } from '@nestjs/common';
import { db } from '@sahakar/database';
import { orderRequests, pendingItems, auditEvents, products } from '@sahakar/database';
import { sql, eq } from 'drizzle-orm';
import * as crypto from 'crypto';

interface OrderRow {
    acceptDatetime: Date;
    customerId?: string;
    orderId?: string;
    productId?: string; // UUID from system, optional if finding by legacy
    legacyProductId?: string; // ID from Excel
    productName?: string;
    packing?: string;
    category?: string;
    subcategory?: string;
    primarySupplier?: string;
    secondarySupplier?: string;
    rep?: string;
    mobile?: string;
    mrp?: number;
    reqQty: number;
    customerName?: string;
    acceptedTime?: string;
    oQty?: number;
    cQty?: number;
    modification?: string;
    stage?: string;
}

export interface ProcessOrdersResult {
    totalIngested: number;
    totalAggregated: number;
    pendingItemsCreated: number;
    pendingItemsUpdated: number;
    duplicatesSkipped: number;
}

@Injectable()
export class PpoImportService {
    /**
     * PPO Import → Process Orders Workflow
     * 
     * Canonical Spec Implementation:
     * - Product-level aggregation
     * - Append-only pending_po creation
     * - Advisory locks for concurrency
     * - Audit trail generation
     * - Hash-based deduplication
     */
    async processOrders(
        rows: OrderRow[],
        userEmail: string
    ): Promise<ProcessOrdersResult> {
        const result: ProcessOrdersResult = {
            totalIngested: rows.length,
            totalAggregated: 0,
            pendingItemsCreated: 0,
            pendingItemsUpdated: 0,
            duplicatesSkipped: 0
        };

        // Start transaction with advisory lock
        await db.transaction(async (tx) => {
            // 1. Acquire advisory lock for this date
            const acceptDate = rows[0]?.acceptDatetime;
            if (!acceptDate) {
                throw new Error('No accept date provided');
            }

            const lockKey = `PROCESS_ORDERS_${acceptDate.toISOString().split('T')[0]}`;
            const lockHash = this.hashLockKey(lockKey);

            await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockHash})`);

            // 1a. Build Product Lookup Map (Legacy ID -> UUID)
            const legacyIds = rows.map(r => r.legacyProductId).filter(id => !!id);
            const productMap = new Map<string, string>(); // legacyId -> uuid

            if (legacyIds.length > 0) {
                const foundProducts = await tx
                    .select({ id: products.id, legacyId: products.legacyId })
                    .from(products)
                    .where(sql`${products.legacyId} IN ${legacyIds}`);

                foundProducts.forEach(p => {
                    if (p.legacyId) productMap.set(p.legacyId, p.id);
                });
            }

            // 2. Insert into order_requests (immutable, append-only)
            for (const row of rows) {
                // Resolve UUID from Legacy ID if possible
                const resolvedProductId = row.productId || (row.legacyProductId ? productMap.get(row.legacyProductId) : null);

                // Generate hash for deduplication
                const rowHash = this.generateRowHash({ ...row, productId: resolvedProductId || row.legacyProductId });

                try {
                    await tx.insert(orderRequests).values({
                        acceptDatetime: row.acceptDatetime,
                        customerId: row.customerId,
                        orderId: row.orderId,
                        productId: resolvedProductId, // Can be null
                        legacyProductId: row.legacyProductId,
                        productName: row.productName,
                        packing: row.packing,
                        category: row.category,
                        subcategory: row.subcategory,
                        primarySupplier: row.primarySupplier,
                        secondarySupplier: row.secondarySupplier,
                        rep: row.rep,
                        mobile: row.mobile,
                        mrp: row.mrp ? row.mrp.toString() : null,
                        reqQty: row.reqQty,
                        customerName: row.customerName,
                        acceptedTime: row.acceptedTime,
                        oQty: row.oQty,
                        cQty: row.cQty,
                        modification: row.modification,
                        stage: row.stage,
                        hash: rowHash
                    });
                } catch (error) {
                    // Hash conflict = duplicate, skip
                    if (error.code === '23505') {
                        result.duplicatesSkipped++;
                        continue;
                    }
                    console.error('Error processing row:', row, error);
                    // Don't throw for individual row errors, maybe? Or throw strictly?
                    // Canonical spec says skip duplicates, throw others.
                    throw error;
                }
            }

            // 3. Aggregate by product_id and accept_date
            const aggregated = await tx
                .select({
                    productId: orderRequests.productId,
                    acceptDate: orderRequests.acceptDatetime,
                    totalQty: sql<number>`SUM(${orderRequests.reqQty})`.as('total_qty'),
                    remarks: sql<string>`string_agg(
            CONCAT('Ord:', ${orderRequests.orderId}, ' Cust:', ${orderRequests.customerId}, ' Qty:', ${orderRequests.reqQty}),
            ', ' ORDER BY ${orderRequests.createdAt}
          )`.as('remarks')
                })
                .from(orderRequests)
                .where(
                    sql`DATE(${orderRequests.acceptDatetime}) = DATE(${acceptDate})`
                )
                .groupBy(orderRequests.productId, sql`DATE(${orderRequests.acceptDatetime})`);

            result.totalAggregated = aggregated.length;

            // 4. Upsert into pending_items
            for (const agg of aggregated) {
                if (!agg.productId) continue;

                // Check if pending item exists for this product
                const existing = await tx
                    .select()
                    .from(pendingItems)
                    .where(eq(pendingItems.productId, agg.productId))
                    .limit(1);

                if (existing.length > 0 && existing[0].state === 'PENDING' && !existing[0].locked) {
                    // Update existing (append remarks, add quantity)
                    await tx
                        .update(pendingItems)
                        .set({
                            reqQty: sql`${pendingItems.reqQty} + ${agg.totalQty}`,
                            allocatorNotes: sql`COALESCE(${pendingItems.allocatorNotes}, '') || '\n' || ${agg.remarks}`,
                            updatedAt: new Date()
                        })
                        .where(eq(pendingItems.id, existing[0].id));

                    result.pendingItemsUpdated++;
                } else {
                    // Create new pending item
                    await tx.insert(pendingItems).values({
                        productId: agg.productId,
                        reqQty: agg.totalQty,
                        orderedQty: 0,
                        stockQty: 0,
                        offerQty: 0,
                        allocatorNotes: agg.remarks,
                        decidedSupplierId: null,
                        done: false,
                        locked: false,
                        state: 'PENDING'
                    });

                    result.pendingItemsCreated++;
                }
            }

            // 5. Create audit event
            await tx.insert(auditEvents).values({
                entityType: 'PPO_IMPORT',
                entityId: null,
                action: 'PROCESS_ORDERS',
                beforeState: null,
                afterState: JSON.stringify({
                    acceptDate: acceptDate.toISOString(),
                    rowsProcessed: rows.length,
                    pendingItemsCreated: result.pendingItemsCreated,
                    pendingItemsUpdated: result.pendingItemsUpdated
                }),
                actor: userEmail,
                createdAt: new Date()
            });
        });

        return result;
    }



    /**
     * Parse Excel file and process orders
     */
    async parseAndProcessOrders(
        fileBuffer: Buffer,
        userEmail: string
    ): Promise<ProcessOrdersResult> {
        const XLSX = require('xlsx');
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rawRows = XLSX.utils.sheet_to_json(sheet);

        // Map to OrderRow
        const rows: OrderRow[] = rawRows.map((row: any) => ({
            acceptDatetime: new Date(), // Will be set below
            customerId: row['Customer id']?.toString(),
            customerName: row['Customer Name']?.toString(),
            orderId: row['order_id']?.toString(),
            legacyProductId: row['Product id']?.toString(),
            productId: undefined, // Will be looked up
            productName: row['product_name']?.toString(),
            packing: row['Packing']?.toString(),
            category: undefined, // Not in Excel
            subcategory: row['Subcategory']?.toString(),
            primarySupplier: row['Primary Sup']?.toString(),
            secondarySupplier: row['Secondary Sup']?.toString(),
            rep: row['Rep']?.toString(),
            mobile: row['Mobile']?.toString(),
            mrp: parseFloat(row['mrp'] || '0'),
            reqQty: parseInt(row['Req Qty'] || '0', 10),
            acceptedTime: row['Accepted Time']?.toString(),
            oQty: parseInt(row['O.Qty'] || '0', 10),
            cQty: parseInt(row['C.Qty'] || '0', 10),
            modification: row['Modification']?.toString(),
            stage: row['Stage']?.toString()
        }));

        // Validation: Must have at least a product ID (legacy or uuid) and qty
        const validRows = rows.filter(r => (r.productId || r.legacyProductId) && r.reqQty > 0);

        if (validRows.length === 0) {
            throw new Error('No valid rows found in Excel file');
        }

        // Use acceptDatetime from Excel 'Accept date' column
        const firstRowDate = rawRows[0]?.['Accept date'];
        let importDate = new Date();

        if (firstRowDate) {
            // Handle date parsing - could be Date object or string like "3-1-2026"
            if (firstRowDate instanceof Date) {
                importDate = firstRowDate;
            } else {
                // Parse string format "d-m-yyyy" or similar
                const parts = firstRowDate.toString().split('-');
                if (parts.length === 3) {
                    // Assume d-m-yyyy format
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
                    const year = parseInt(parts[2], 10);
                    importDate = new Date(year, month, day);
                }
            }
        }

        validRows.forEach(r => r.acceptDatetime = importDate);

        return this.processOrders(validRows, userEmail);
    }

    /**
     * Generate hash for row deduplication
     */
    private generateRowHash(row: OrderRow): string {
        const hashInput = `${row.acceptDatetime.toISOString()}|${row.orderId}|${row.productId}|${row.reqQty}`;
        return crypto.createHash('sha256').update(hashInput).digest('hex');
    }

    /**
     * Generate numeric hash for PostgreSQL advisory lock
     */
    private hashLockKey(key: string): number {
        const hash = crypto.createHash('sha256').update(key).digest();
        return hash.readInt32BE(0);
    }
}
