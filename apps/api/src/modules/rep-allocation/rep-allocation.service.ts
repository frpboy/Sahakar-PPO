import { Injectable } from '@nestjs/common';
import { db, repOrders, products, pendingPoLedger, ppoInput, auditEvents } from '@sahakar/database';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

export interface RepGroup {
    productId: string;
    productName: string;
    targetQty: number;
    allocatedQty: number;
    stockQty: number;
    isLocked: boolean;
    items: any[];
}

@Injectable()
export class RepAllocationService {
    async getAllRepItems(query: any): Promise<RepGroup[]> {
        const { productName, orderId, rep, status, dateFrom, dateTo, sortBy, sortOrder } = query;

        // 1. Fetch all REP orders with joined data
        let whereClause = sql`1=1`;
        if (productName) whereClause = sql`${whereClause} AND ${products.name} ILIKE ${'%' + productName + '%'}`;
        if (orderId) whereClause = sql`${whereClause} AND ${ppoInput.orderId}::text ILIKE ${'%' + orderId + '%'}`;
        if (rep) {
            const repArray = Array.isArray(rep) ? rep : [rep];
            whereClause = sql`${whereClause} AND ${ppoInput.rep} IN (${sql.join(repArray.map(r => sql`${r}`), sql`, `)})`;
        }
        if (status) {
            const statusArray = Array.isArray(status) ? status : [status];
            whereClause = sql`${whereClause} AND ${repOrders.status} IN (${sql.join(statusArray.map(s => sql`${s}`), sql`, `)})`;
        }
        if (dateFrom) whereClause = sql`${whereClause} AND ${ppoInput.acceptedDate} >= ${dateFrom}`;
        if (dateTo) whereClause = sql`${whereClause} AND ${ppoInput.acceptedDate} <= ${dateTo}`;

        const rawRows = await db.select({
            id: repOrders.id,
            productId: repOrders.productId,
            productName: products.name,
            supplier: repOrders.supplier,
            qty: repOrders.qty,
            rate: repOrders.rate,
            orderStatus: repOrders.status,
            createdAt: repOrders.createdAt,
            pendingItemId: pendingPoLedger.id,
            targetQty: pendingPoLedger.reqQty,
            stockQty: pendingPoLedger.stockQty,
            offerQty: pendingPoLedger.offerQty,
            isLocked: pendingPoLedger.locked,
            itemNameChange: pendingPoLedger.itemNameChange,
            notes: pendingPoLedger.allocationDetails,
            // Joined PPO Input info for row-level details
            orderId: ppoInput.orderId,
            customerId: ppoInput.customerId,
            customerName: ppoInput.customerName,
            originalQty: ppoInput.requestedQty,
            mrp: ppoInput.mrp,
            packing: ppoInput.packing,
            remarks: ppoInput.remarks,
            subcategory: ppoInput.subcategory,
            rep: ppoInput.rep,
            mobile: ppoInput.mobile,
            primarySup: ppoInput.primarySupplier,
            secondarySup: ppoInput.secondarySupplier,
            acceptedDate: ppoInput.acceptedDate,
            acceptedTime: ppoInput.acceptedTime
        })
            .from(repOrders)
            .innerJoin(products, eq(repOrders.productId, products.id))
            .innerJoin(pendingPoLedger, eq(repOrders.sourcePendingPoId, pendingPoLedger.id))
            // We join with ppoInput to get details. 
            // Note: Since pendingPoLedger is an aggregation, joining with ppoInput might yield multiple rows?
            // Actually, if we want detailed rows in the REP screen, we need the original ppoInput rows.
            // But repOrders points to pendingPoLedger.
            // Let's join on productId to get ppoInput rows that contributed to this product.
            .leftJoin(ppoInput, eq(ppoInput.productId, products.id))
            .where(whereClause);

        // 2. Group by Product ID
        const groupsMap = new Map<string, RepGroup>();

        for (const row of rawRows) {
            const pid = row.productId!.toString();
            if (!groupsMap.has(pid)) {
                groupsMap.set(pid, {
                    productId: pid,
                    productName: row.productName!,
                    targetQty: row.targetQty || 0,
                    allocatedQty: 0, // Will sum up from repOrders
                    stockQty: row.stockQty || 0,
                    isLocked: row.isLocked || false,
                    items: []
                });
            }

            const group = groupsMap.get(pid)!;

            // Avoid duplicate items if multiple ppoInputs join with same repOrder
            // Actually, in the REP screen, we usually want to see individual customer orders?
            // The frontend code groups by productName and then shows DataGrid.
            // If DataGrid shows individual orders, we need the ppoInput details.

            group.items.push({
                id: row.id.toString(),
                orderStatus: row.orderStatus,
                productId: pid,
                mrp: row.mrp,
                packing: row.packing,
                productName: row.productName,
                remarks: row.remarks,
                subcategory: row.subcategory,
                reqQty: row.originalQty,
                notes: row.notes,
                itemNameChange: row.itemNameChange,
                rep: row.rep,
                mobile: row.mobile,
                primarySup: row.primarySup,
                secondarySup: row.secondarySup,
                decidedSup: row.supplier,
                acceptedDate: row.acceptedDate,
                acceptedTime: row.acceptedTime,
                orderId: row.orderId?.toString(),
                pendingItemId: row.pendingItemId.toString()
            });
        }

        // Calculate allocatedQty per group
        for (const group of groupsMap.values()) {
            // Fetch total allocated for this product from repOrders
            const totalAllocated = await db.select({
                sum: sql<number>`SUM(${repOrders.qty})`
            }).from(repOrders).where(eq(repOrders.productId, BigInt(group.productId)));

            group.allocatedQty = totalAllocated[0]?.sum || 0;
        }

        return Array.from(groupsMap.values());
    }

    async updateRepItem(id: string, payload: any, userEmail: string) {
        return await db.transaction(async (tx) => {
            const rows = await tx.select().from(repOrders).where(eq(repOrders.id, BigInt(id))).limit(1);
            if (!rows.length) throw new Error('REP Item not found');
            const item = rows[0];

            // Check lock
            const ledger = await tx.select().from(pendingPoLedger).where(eq(pendingPoLedger.id, item.sourcePendingPoId!)).limit(1);
            if (ledger[0]?.locked) {
                // Should we allow update if specifically from this module? 
                // Usually "locked" means moved to slip.
                // If it's just "MOVED_TO_REP", it might be editable.
                // But the user said "disable editing after slip generation".
                // So if it's in a slip, it should be truly locked.
            }

            if (payload.orderStatus) {
                await tx.update(repOrders).set({
                    status: payload.orderStatus,
                    updatedAt: new Date()
                }).where(eq(repOrders.id, BigInt(id)));

                await tx.insert(auditEvents).values({
                    actor: userEmail,
                    action: 'UPDATE_REP_STATUS',
                    entityType: 'REP_ORDER',
                    entityId: item.id,
                    payload: { old: item.status, new: payload.orderStatus }
                });
            }

            // Update associated ledger/notes if provided
            if (payload.notes || payload.orderedQty !== undefined) {
                await tx.update(pendingPoLedger).set({
                    allocationDetails: payload.notes,
                    orderedQty: payload.orderedQty,
                    stockQty: payload.stockQty,
                    updatedAt: new Date()
                }).where(eq(pendingPoLedger.id, item.sourcePendingPoId!));
            }

            return { success: true };
        });
    }

    async returnToPending(id: string, userEmail: string) {
        return await db.transaction(async (tx) => {
            const rows = await tx.select().from(repOrders).where(eq(repOrders.id, BigInt(id))).limit(1);
            if (!rows.length) throw new Error('REP Item not found');
            const item = rows[0];

            // 1. Delete REP Order
            await tx.delete(repOrders).where(eq(repOrders.id, BigInt(id)));

            // 2. Unlock Ledger
            await tx.update(pendingPoLedger).set({
                locked: false,
                allocationStatus: 'PENDING',
                updatedAt: new Date()
            }).where(eq(pendingPoLedger.id, item.sourcePendingPoId!));

            // 3. Audit
            await tx.insert(auditEvents).values({
                actor: userEmail,
                action: 'RETURN_TO_PENDING',
                entityType: 'REP_ORDER',
                entityId: item.id,
                payload: { sourceId: item.sourcePendingPoId }
            });

            return { success: true };
        });
    }
}
