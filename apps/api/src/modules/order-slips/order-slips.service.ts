import { Injectable } from '@nestjs/common';
import { db, pendingItems, repItems, orderSlips, orderSlipItems, auditEvents } from '@sahakar/database';
import { sql, eq, and } from 'drizzle-orm';

@Injectable()
export class OrderSlipsService {
    /**
     * Workflow 4: Order Slip Generation
     * 
     * Rules:
     * - Idempotency key: SLIP_{supplier}_{date}
     * - Aggregate from pending_po + rep_orders
     * - Only done=true items
     * - Regeneration control flag
     */
    async generateSlips(
        supplierIds: string[],
        slipDate: string,
        userEmail: string,
        regenerate: boolean = false
    ) {
        return await db.transaction(async (tx) => {
            const results = [];

            for (const supplierId of supplierIds) {
                // Idempotency check
                const lockKey = `SLIP_${supplierId}_${slipDate}`;
                const existingSlips = await tx
                    .select()
                    .from(orderSlips)
                    .where(
                        and(
                            eq(orderSlips.supplierId, supplierId),
                            sql`DATE(${orderSlips.slipDate}) = DATE(${slipDate})`
                        )
                    );

                if (existingSlips.length > 0 && !regenerate) {
                    results.push({ supplierId, skipped: true, reason: 'Slip already exists' });
                    continue;
                }

                // Delete existing if regenerating
                if (existingSlips.length > 0 && regenerate) {
                    for (const slip of existingSlips) {
                        await tx.delete(orderSlipItems).where(eq(orderSlipItems.orderSlipId, slip.id));
                        await tx.delete(orderSlips).where(eq(orderSlips.id, slip.id));
                    }
                }

                // Get pending items (stock + offer quantities)
                const pendingItemsForSlip = await tx
                    .select()
                    .from(pendingItems)
                    .where(
                        and(
                            eq(pendingItems.decidedSupplierId, supplierId),
                            eq(pendingItems.done, true),
                            eq(pendingItems.locked, false)
                        )
                    );

                // Get REP items
                const repItemsForSlip = await tx
                    .select()
                    .from(repItems)
                    .where(
                        and(
                            eq(repItems.orderedSupplierId, supplierId),
                            eq(repItems.done, true),
                            eq(repItems.state, 'READY_FOR_SLIP')
                        )
                    );

                const totalItems = pendingItemsForSlip.length + repItemsForSlip.length;

                if (totalItems === 0) {
                    results.push({ supplierId, skipped: true, reason: 'No items ready for slip' });
                    continue;
                }

                // Create order slip
                const slipResult = await tx.insert(orderSlips).values({
                    supplierId: supplierId,
                    slipDate: new Date(slipDate),
                    generatedBy: userEmail
                }).returning({ id: orderSlips.id });

                const slipId = slipResult[0].id;

                // Add pending items (stock + offer)
                for (const item of pendingItemsForSlip) {
                    const qty = (item.stockQty || 0) + (item.offerQty || 0);
                    if (qty > 0 && item.productId) {
                        await tx.insert(orderSlipItems).values({
                            orderSlipId: slipId,
                            productId: item.productId,
                            qty: qty,
                            status: 'PENDING'
                        });
                    }
                }

                // Add REP items
                for (const item of repItemsForSlip) {
                    if (item.productId) {
                        await tx.insert(orderSlipItems).values({
                            orderSlipId: slipId,
                            productId: item.productId,
                            qty: item.reqQty,
                            status: 'PENDING'
                        });
                    }

                    // Update REP item state
                    await tx.update(repItems)
                        .set({ state: 'SLIPPED' })
                        .where(eq(repItems.id, item.id));
                }

                // Lock pending items
                for (const item of pendingItemsForSlip) {
                    await tx.update(pendingItems)
                        .set({ locked: true, state: 'SLIPPED' })
                        .where(eq(pendingItems.id, item.id));
                }

                // Audit event
                await tx.insert(auditEvents).values({
                    entityType: 'ORDER_SLIP',
                    entityId: slipId,
                    action: 'GENERATE',
                    beforeState: null,
                    afterState: JSON.stringify({
                        supplierId,
                        slipDate,
                        pendingItems: pendingItemsForSlip.length,
                        repItems: repItemsForSlip.length
                    }),
                    actor: userEmail
                });

                results.push({ supplierId, slipId, itemCount: totalItems });
            }

            return { success: true, results };
        });
    }
}
