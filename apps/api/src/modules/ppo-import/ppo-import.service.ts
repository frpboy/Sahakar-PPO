import { Injectable } from '@nestjs/common';
import { db } from '@sahakar/database';
import { orderRequests, pendingItems, auditEvents } from '@sahakar/database';
import { sql, eq } from 'drizzle-orm';
import * as crypto from 'crypto';

interface OrderRow {
    acceptDatetime: Date;
    customerId?: string;
    orderId?: string;
    productId: string;
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

            // 2. Insert into order_requests (immutable, append-only)
            for (const row of rows) {
                // Generate hash for deduplication
                const rowHash = this.generateRowHash(row);

                try {
                    await tx.insert(orderRequests).values({
                        acceptDatetime: row.acceptDatetime,
                        customerId: row.customerId,
                        orderId: row.orderId,
                        productId: row.productId,
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
                        hash: rowHash
                    });
                } catch (error) {
                    // Hash conflict = duplicate, skip
                    if (error.code === '23505') {
                        result.duplicatesSkipped++;
                        continue;
                    }
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
            acceptDatetime: new Date(), // Default to now if missing, or specific column
            customerId: row['Customer ID']?.toString(),
            orderId: row['Order ID']?.toString() || row['Order_ID']?.toString(),
            productId: row['Product ID']?.toString() || row['Item_ID']?.toString(),
            productName: row['Product Name']?.toString(),
            packing: row['Packing']?.toString(),
            category: row['Category']?.toString(),
            subcategory: row['Sub Category']?.toString(),
            primarySupplier: row['Supplier 1']?.toString(),
            secondarySupplier: row['Supplier 2']?.toString(),
            rep: row['REP Name']?.toString(),
            mobile: row['Mobile']?.toString(),
            mrp: parseFloat(row['MRP'] || '0'),
            reqQty: parseInt(row['Qty'] || row['Quantity'] || '0', 10)
        }));

        // Validate rows
        const validRows = rows.filter(r => r.productId && r.reqQty > 0);

        if (validRows.length === 0) {
            throw new Error('No valid rows found in Excel file');
        }

        // Use acceptDatetime from first row if available in Excel, else fallback to now
        // But canonical spec says locks are based on acceptDate. 
        // We will assume today for import.
        const importDate = new Date();
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
