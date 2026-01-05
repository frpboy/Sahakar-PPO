import { Injectable } from '@nestjs/common';
import { db, pendingPoLedger, repOrders, orderSlips, orderSlipItems, auditEvents } from '@sahakar/database';
import { sql, eq, and } from 'drizzle-orm';

@Injectable()
export class OrderSlipsService {
    /**
     * Generate or Append to Order Slips
     */
    async generateSlips(
        supplierNames: string[],
        slipDate: string,
        userEmail: string
    ) {
        return await db.transaction(async (tx) => {
            const results = [];
            let totalGenerated = 0;

            for (const supplierName of supplierNames) {
                // 1. Fetch REP orders for this supplier that are PENDING
                const repOrdersForSlip = await tx.select().from(repOrders).where(
                    and(
                        eq(repOrders.supplier, supplierName),
                        eq(repOrders.status, 'PENDING')
                    )
                );

                if (repOrdersForSlip.length === 0) continue;

                // 2. Check if slip already exists for this (supplier + date)
                let slipId: bigint;
                let existing = await tx.select().from(orderSlips).where(
                    and(
                        eq(orderSlips.supplier, supplierName),
                        eq(orderSlips.slipDate, slipDate)
                    )
                ).limit(1);

                if (existing.length > 0) {
                    slipId = existing[0].id;
                } else {
                    // Generate Human Friendly ID: SLP-YYYY-MM-XXXX
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = (now.getMonth() + 1).toString().padStart(2, '0');
                    const prefix = `SLP-${year}-${month}-`;

                    const lastSlips = await tx.select().from(orderSlips)
                        .where(sql`${orderSlips.displayId} LIKE ${prefix + '%'}`)
                        .orderBy(sql`${orderSlips.displayId} DESC`)
                        .limit(1);

                    let nextNum = 1;
                    if (lastSlips.length > 0 && lastSlips[0].displayId) {
                        const parts = lastSlips[0].displayId.split('-');
                        const lastNum = parseInt(parts[parts.length - 1]);
                        if (!isNaN(lastNum)) nextNum = lastNum + 1;
                    }
                    const displayId = `${prefix}${nextNum.toString().padStart(4, '0')}`;

                    // Create new slip
                    const [newSlip] = await tx.insert(orderSlips).values({
                        supplier: supplierName,
                        slipDate,
                        totalItems: 0,
                        totalValue: '0',
                        displayId,
                        status: 'GENERATED'
                    }).returning();
                    slipId = newSlip.id;
                }

                // 3. Add items to orderSlipItems and mark repOrders as SLIPPED
                let addedCount = 0;
                for (const ro of repOrdersForSlip) {
                    await tx.insert(orderSlipItems).values({
                        orderSlipId: slipId,
                        productId: ro.productId,
                        qty: ro.qty || 0,
                        rate: ro.rate,
                        status: 'Pending'
                    });

                    // Update REP order status
                    await tx.update(repOrders)
                        .set({ status: 'SLIPPED', updatedAt: new Date() })
                        .where(eq(repOrders.id, ro.id));

                    addedCount++;
                }

                // 4. Recalculate Totals
                const slipItems = await tx.select().from(orderSlipItems).where(eq(orderSlipItems.orderSlipId, slipId));
                const totalItems = slipItems.length;
                const totalValue = slipItems.reduce((acc, item) => acc + (parseFloat(item.rate || '0') * (item.qty || 0)), 0);

                await tx.update(orderSlips).set({
                    totalItems,
                    totalValue: totalValue.toString(),
                    updatedAt: new Date()
                }).where(eq(orderSlips.id, slipId));

                // 5. Audit
                await tx.insert(auditEvents).values({
                    actor: userEmail,
                    action: 'GENERATE_SLIP',
                    entityType: 'ORDER_SLIP',
                    entityId: slipId,
                    payload: { addedCount, supplierName, slipDate } as any
                });

                results.push({ supplierName, slipId: slipId.toString(), addedCount });
                totalGenerated += addedCount;
            }

            return {
                success: true,
                generated: totalGenerated,
                message: totalGenerated > 0
                    ? `Successfully generated ${totalGenerated} allocations across ${results.length} slips.`
                    : "No eligible allocations found.",
                results
            };
        });
    }

    async getAllSlips(query: any) {
        let q = db.select().from(orderSlips);

        const conditions = [];
        if (query.supplier) {
            conditions.push(sql`${orderSlips.supplier} ILIKE ${'%' + query.supplier + '%'}`);
        }
        if (query.status) {
            conditions.push(eq(orderSlips.status, query.status));
        }
        if (query.dateFrom) {
            conditions.push(sql`${orderSlips.slipDate} >= ${query.dateFrom}`);
        }
        if (query.dateTo) {
            conditions.push(sql`${orderSlips.slipDate} <= ${query.dateTo}`);
        }

        if (conditions.length > 0) {
            // @ts-ignore
            q = q.where(and(...conditions));
        }

        // Apply sorting
        if (query.sortField && query.sortOrder) {
            const direction = query.sortOrder.toUpperCase() === 'DESC' ? sql`DESC` : sql`ASC`;
            const field = orderSlips[query.sortField as keyof typeof orderSlips];
            if (field) {
                // @ts-ignore
                q = q.orderBy(sql`${field} ${direction}`);
            }
        } else {
            q = q.orderBy(sql`${orderSlips.createdAt} DESC`);
        }

        return await q;
    }

    async getSlipDetails(slipId: string) {
        const slip = await db.select().from(orderSlips).where(eq(orderSlips.id, BigInt(slipId))).limit(1);
        if (!slip.length) return null;

        const items = await db.execute(sql`
            SELECT 
                osi.id,
                osi.qty,
                osi.rate,
                osi.status,
                osi.invoice_id,
                osi.notes,
                p.name as product_name,
                p.packing,
                p.product_code,
                p.id as product_id
            FROM order_slip_items osi
            LEFT JOIN products p ON osi.product_id = p.id
            WHERE osi.order_slip_id = ${BigInt(slipId)}
        `);

        return {
            ...slip[0],
            items: items.rows
        };
    }

    async updateItemStatus(slipId: string, itemId: string, payload: any, userEmail: string) {
        return await db.transaction(async (tx) => {
            const [item] = await tx.select().from(orderSlipItems).where(eq(orderSlipItems.id, BigInt(itemId))).limit(1);
            if (!item) throw new Error('Item not found');

            await tx.update(orderSlipItems)
                .set({
                    status: payload.status,
                    invoiceId: payload.invoiceId,
                    notes: payload.notes,
                    updatedAt: new Date()
                })
                .where(eq(orderSlipItems.id, BigInt(itemId)));

            // Add audit
            await tx.insert(auditEvents).values({
                actor: userEmail,
                action: 'UPDATE_SLIP_ITEM_STATUS',
                entityType: 'ORDER_SLIP_ITEM',
                entityId: BigInt(itemId),
                payload: { ...payload, slipId } as any
            });

            return { success: true };
        });
    }
}
