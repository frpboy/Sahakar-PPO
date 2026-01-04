import { Injectable } from '@nestjs/common';
import { db, pendingPoLedger, repOrders, auditEvents, statusEvents, products, suppliers } from '@sahakar/database';
import { sql, eq, and } from 'drizzle-orm';

@Injectable()
export class PendingPoService {
    /**
     * Get all pending ledger items with product details
     */
    async getAllPendingItems() {
        const items = await db.execute(sql`
            SELECT 
                pl.id,
                pl.product_id,
                pl.req_qty,
                pl.ordered_qty,
                pl.stock_qty,
                pl.offer_qty,
                pl.allocation_status,
                pl.locked,
                pl.supplier_priority,
                p.name as product_name,
                p.packing,
                p.mrp,
                p.ptr,
                p.pt,
                p.local_cost,
                p.category,
                p.sub_category as subcategory,
                p.generic_name,
                p.patent,
                p.hsn_code,
                (SELECT string_agg(DISTINCT rep, ', ') FROM ppo_input WHERE product_id = pl.product_id AND stage = 'Pending') as rep,
                (SELECT string_agg(DISTINCT mobile, ', ') FROM ppo_input WHERE product_id = pl.product_id AND stage = 'Pending') as mobile,
                (SELECT MIN(accepted_date) FROM ppo_input WHERE product_id = pl.product_id AND stage = 'Pending') as accepted_date,
                (SELECT MIN(accepted_time) FROM ppo_input WHERE product_id = pl.product_id AND stage = 'Pending') as accepted_time,
                (SELECT string_agg(DISTINCT primary_supplier, ', ') FROM ppo_input WHERE product_id = pl.product_id AND stage = 'Pending') as ordered_supplier
            FROM pending_po_ledger pl
            LEFT JOIN products p ON pl.product_id = p.id
            WHERE pl.locked = false
            ORDER BY pl.created_at DESC
        `);

        return items.rows;
    }

    /**
     * Update allocation details
     */
    async updateAllocation(
        pendingItemId: string,
        data: {
            orderedQty: number;
            stockQty: number;
            offerQty: number;
            allocatorNotes?: string;
        },
        userEmail: string
    ) {
        return await db.transaction(async (tx) => {
            const items = await tx.select().from(pendingPoLedger).where(eq(pendingPoLedger.id, BigInt(pendingItemId))).limit(1);
            if (!items.length) throw new Error('Item not found');
            const item = items[0];

            if (item.locked) throw new Error('Item is locked');

            await tx.update(pendingPoLedger)
                .set({
                    orderedQty: data.orderedQty,
                    stockQty: data.stockQty,
                    offerQty: data.offerQty,
                    updatedAt: new Date()
                })
                .where(eq(pendingPoLedger.id, BigInt(pendingItemId)));

            await tx.insert(auditEvents).values({
                actor: userEmail,
                action: 'ALLOCATE',
                entityType: 'PENDING_PO_LEDGER',
                entityId: item.id,
                payload: data as any
            });

            return { success: true };
        });
    }

    /**
     * Atomic Move to REP
     */
    async moveToRep(
        pendingItemId: string,
        supplierName: string,
        rate: number,
        userEmail: string
    ) {
        return await db.transaction(async (tx) => {
            // Advisory lock to prevent race conditions on the same item
            const lockHash = this.hashLockKey(`MOVE_TO_REP_${pendingItemId}`);
            await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockHash})`);

            const items = await tx.select().from(pendingPoLedger).where(eq(pendingPoLedger.id, BigInt(pendingItemId))).limit(1);
            if (!items.length) throw new Error('Item not found');
            const item = items[0];

            if (item.locked) throw new Error('Item already locked');

            // 1. Lock pending row
            await tx.update(pendingPoLedger)
                .set({
                    locked: true,
                    allocationStatus: 'MOVED_TO_REP'
                })
                .where(eq(pendingPoLedger.id, BigInt(pendingItemId)));

            // 2. Insert REP order
            const [repOrder] = await tx.insert(repOrders).values({
                productId: item.productId,
                supplier: supplierName,
                qty: item.orderedQty || 0,
                rate: rate.toString(),
                sourcePendingPoId: item.id
            }).returning();

            // 3. Write Audit Event
            await tx.insert(auditEvents).values({
                actor: userEmail,
                action: 'MOVE_TO_REP',
                entityType: 'REP_ORDER',
                entityId: repOrder.id,
                payload: { sourceId: item.id, supplierName, qty: item.orderedQty } as any
            });

            // 4. Update Status Events
            await tx.insert(statusEvents).values({
                entityType: 'REP',
                entityId: repOrder.id,
                oldStatus: 'PENDING',
                newStatus: 'REP_ACTIVE',
                note: `Moved from Pending PO Ledger ID ${item.id}`,
                createdBy: userEmail
            });

            return { success: true, repOrderId: repOrder.id.toString() };
        });
    }

    private hashLockKey(key: string): number {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(key).digest();
        return hash.readInt32BE(0);
    }
}
