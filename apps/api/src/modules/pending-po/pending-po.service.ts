import { Injectable } from '@nestjs/common';
import { db, pendingItems, repItems, auditEvents } from '@sahakar/database';
import { sql, eq, and } from 'drizzle-orm';

@Injectable()
export class PendingPoService {
    /**
     * Get all pending items with product details
     */
    async getAllPendingItems() {
        const items = await db.execute(sql`
            SELECT 
                pi.id,
                pi.product_id,
                pi.req_qty,
                pi.ordered_qty,
                pi.stock_qty,
                pi.offer_qty,
                pi.decided_supplier_id,
                pi.allocator_notes,
                pi.done,
                pi.locked,
                pi.state,
                p.item_name as product_name,
                p.packing,
                p.mrp,
                p.ptr,
                p.category,
                p.subcategory,
                s.supplier_name as decided_supplier_name
            FROM pending_items pi
            LEFT JOIN products p ON pi.product_id = p.id
            LEFT JOIN suppliers s ON pi.decided_supplier_id = s.id
            WHERE pi.state = 'PENDING'
            ORDER BY pi.created_at DESC
        `);

        return items.rows;
    }

    /**
     * Workflow 2: Pending PO Allocator
     * 
     * Rules:
     * - ordered_qty + stock_qty + offer_qty ≤ req_qty
     * - Must select supplier
     * - Lock after slip generation
     */
    async updateAllocation(
        pendingItemId: string,
        data: {
            orderedQty: number;
            stockQty: number;
            offerQty: number;
            decidedSupplierId: string;
            allocatorNotes?: string;
            done: boolean;
        },
        userEmail: string
    ) {
        return await db.transaction(async (tx) => {
            // Get current item
            const items = await tx.select().from(pendingItems).where(eq(pendingItems.id, pendingItemId)).limit(1);

            if (!items.length) {
                throw new Error('Pending item not found');
            }

            const item = items[0];

            // Validation: Cannot edit if locked
            if (item.locked) {
                throw new Error('Item is locked - already moved to REP or slipped');
            }

            // Validation: Quantity constraint
            const totalAllocated = data.orderedQty + data.stockQty + data.offerQty;
            if (totalAllocated > item.reqQty) {
                throw new Error(`Total allocation (${totalAllocated}) exceeds required quantity (${item.reqQty})`);
            }

            // Update pending item
            await tx.update(pendingItems)
                .set({
                    orderedQty: data.orderedQty,
                    stockQty: data.stockQty,
                    offerQty: data.offerQty,
                    decidedSupplierId: data.decidedSupplierId,
                    allocatorNotes: data.allocatorNotes,
                    done: data.done,
                    updatedAt: new Date()
                })
                .where(eq(pendingItems.id, pendingItemId));

            // Audit event
            await tx.insert(auditEvents).values({
                entityType: 'PENDING_PO',
                entityId: pendingItemId,
                action: 'ALLOCATE',
                beforeState: JSON.stringify(item),
                afterState: JSON.stringify({ ...item, ...data }),
                actor: userEmail
            });

            return { success: true };
        });
    }

    /**
     * Workflow 3: Move to REP
     * 
     * Rules:
     * - Atomic migration
     * - Lock pending item
     * - Create REP item
     * - Advisory lock: MOVE_TO_REP_{id}
     */
    async moveToRep(
        pendingItemId: string,
        userEmail: string
    ) {
        return await db.transaction(async (tx) => {
            // Advisory lock
            const lockHash = this.hashLockKey(`MOVE_TO_REP_${pendingItemId}`);
            await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockHash})`);

            // Get pending item
            const items = await tx.select().from(pendingItems).where(eq(pendingItems.id, pendingItemId)).limit(1);

            if (!items.length) {
                throw new Error('Pending item not found');
            }

            const item = items[0];

            if (item.locked) {
                throw new Error('Item already locked');
            }

            if (!item.done) {
                throw new Error('Item must be marked done before moving to REP');
            }

            // Lock pending item
            await tx.update(pendingItems)
                .set({
                    locked: true,
                    state: 'MOVED_TO_REP',
                    updatedAt: new Date()
                })
                .where(eq(pendingItems.id, pendingItemId));

            // Create REP item
            const repItemId = await tx.insert(repItems).values({
                pendingItemId: pendingItemId,
                productId: item.productId,
                reqQty: item.orderedQty, // Only ordered quantity goes to REP
                notes: item.allocatorNotes || null,
                orderedSupplierId: item.decidedSupplierId,
                done: false,
                state: 'REP_ACTIVE'
            }).returning({ id: repItems.id });

            // Audit event
            await tx.insert(auditEvents).values({
                entityType: 'PENDING_PO',
                entityId: pendingItemId,
                action: 'MOVE_TO_REP',
                beforeState: JSON.stringify(item),
                afterState: JSON.stringify({ locked: true, state: 'MOVED_TO_REP', repItemId: repItemId[0].id }),
                actor: userEmail
            });

            return { success: true, repItemId: repItemId[0].id };
        });
    }

    /**
     * Return from REP to Pending
     */
    async returnFromRep(
        repItemId: string,
        userEmail: string
    ) {
        return await db.transaction(async (tx) => {
            // Get REP item
            const reps = await tx.select().from(repItems).where(eq(repItems.id, repItemId)).limit(1);

            if (!reps.length) {
                throw new Error('REP item not found');
            }

            const repItem = reps[0];

            if (!repItem.pendingItemId) {
                throw new Error('No associated pending item');
            }

            // Unlock pending item
            await tx.update(pendingItems)
                .set({
                    locked: false,
                    state: 'PENDING',
                    updatedAt: new Date()
                })
                .where(eq(pendingItems.id, repItem.pendingItemId));

            // Delete REP item
            await tx.delete(repItems).where(eq(repItems.id, repItemId));

            // Audit event
            await tx.insert(auditEvents).values({
                entityType: 'REP_ITEM',
                entityId: repItemId,
                action: 'RETURN_TO_PENDING',
                beforeState: JSON.stringify(repItem),
                afterState: null,
                actor: userEmail
            });

            return { success: true };
        });
    }

    private hashLockKey(key: string): number {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(key).digest();
        return hash.readInt32BE(0);
    }
}
