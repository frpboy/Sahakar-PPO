import { Injectable } from '@nestjs/common';
import { db, pendingPoLedger, ppoInput, repOrders, auditEvents, statusEvents, products, suppliers } from '@sahakar/database';
import { sql, eq, and, or } from 'drizzle-orm';

@Injectable()
export class PendingPoService {
    /**
     * Get all pending ledger items with product details
     */
    async getAllPendingItems(params: {
        productName?: string;
        orderId?: string;
        rep?: string[];
        supplier?: string;
        stage?: string[];
        dateFrom?: string;
        dateTo?: string;
        sortField?: string;
        sortDir?: 'asc' | 'desc';
    }) {
        const conditions = [];

        // Note: Filter logic usually targets the ledger orjoined tables
        if (params.productName) {
            conditions.push(sql`LOWER(${products.name}) LIKE ${'%' + params.productName.toLowerCase() + '%'}`);
        }
        if (params.supplier) {
            conditions.push(sql`(
                LOWER(${pendingPoLedger.decidedSupplierName}) LIKE ${'%' + params.supplier.toLowerCase() + '%'} OR
                LOWER(${products.primarySupplier}) LIKE ${'%' + params.supplier.toLowerCase() + '%'}
            )`);
        }
        if (params.stage && params.stage.length > 0) {
            // Ledger doesn't have stage directly, it's inferred or we filter by locked/status
        }
        if (params.dateFrom) {
            conditions.push(sql`${pendingPoLedger.createdAt} >= ${params.dateFrom}`);
        }
        if (params.dateTo) {
            conditions.push(sql`${pendingPoLedger.createdAt} <= ${params.dateTo}`);
        }

        // Subqueries for ppo_input aggregations
        const repSubquery = db.select({
            productId: ppoInput.productId,
            rep: sql<string>`string_agg(DISTINCT ${ppoInput.rep}, ', ')`.as('rep'),
            mobile: sql<string>`string_agg(DISTINCT ${ppoInput.mobile}, ', ')`.as('mobile'),
            acceptedDate: sql<Date>`MIN(${ppoInput.acceptedDate})`.as('accepted_date'),
            acceptedTime: sql<string>`MIN(${ppoInput.acceptedTime})`.as('accepted_time'),
            orderedSupplier: sql<string>`string_agg(DISTINCT ${ppoInput.primarySupplier}, ', ')`.as('ordered_supplier')
        })
            .from(ppoInput)
            .where(eq(ppoInput.stage, 'Pending'))
            .groupBy(ppoInput.productId)
            .as('ppo_agg');

        const query = db.select({
            id: pendingPoLedger.id,
            productId: pendingPoLedger.productId,
            requestedQty: pendingPoLedger.reqQty,
            orderedQty: pendingPoLedger.orderedQty,
            stockQty: pendingPoLedger.stockQty,
            offerQty: pendingPoLedger.offerQty,
            decidedSupplierName: pendingPoLedger.decidedSupplierName,
            allocationStatus: pendingPoLedger.allocationStatus,
            locked: pendingPoLedger.locked,
            supplierPriority: pendingPoLedger.supplierPriority,
            remarks: pendingPoLedger.remarks,
            itemNameChange: pendingPoLedger.itemNameChange,
            allocationDetails: pendingPoLedger.allocationDetails,
            productName: products.name,
            packing: products.packing,
            mrp: products.mrp,
            ptr: products.ptr,
            pt: products.pt,
            localCost: products.localCost,
            category: products.category,
            subcategory: products.subCategory,
            genericName: products.genericName,
            patent: products.patent,
            hsnCode: products.hsnCode,
            legacyId: products.legacyId,
            productCode: products.productCode,
            rep: repSubquery.rep,
            mobile: repSubquery.mobile,
            accepted_date: repSubquery.acceptedDate,
            accepted_time: repSubquery.acceptedTime,
            ordered_supplier: repSubquery.orderedSupplier
        })
            .from(pendingPoLedger)
            .leftJoin(products, eq(pendingPoLedger.productId, products.id))
            .leftJoin(repSubquery, eq(pendingPoLedger.productId, repSubquery.productId))
            .where(and(
                or(eq(pendingPoLedger.locked, false), eq(pendingPoLedger.allocationStatus, 'PENDING')),
                ...conditions as any
            ));

        const sortFieldMap: Record<string, any> = {
            productName: products.name,
            requestedQty: pendingPoLedger.reqQty,
            createdAt: pendingPoLedger.createdAt
        };

        const sortCol = sortFieldMap[params.sortField || 'createdAt'] || pendingPoLedger.createdAt;
        const sortDir = params.sortDir === 'asc' ? sql`ASC` : sql`DESC`;

        query.orderBy(sql`${sortCol} ${sortDir}`);

        const items = await query;
        return items.map(r => ({
            ...r,
            id: r.id?.toString(),
            productId: r.productId?.toString()
        }));
    }

    /**
     * Get original ppo_input rows for aggregation
     */
    async getAllocations(pendingItemId: string) {
        const [pivot] = await db.select().from(pendingPoLedger).where(eq(pendingPoLedger.id, BigInt(pendingItemId))).limit(1);
        if (!pivot || !pivot.productId) throw new Error('Pending item or product mapping not found');

        const rows = await db.select({
            id: ppoInput.id,
            order_id: ppoInput.orderId,
            customer_id: ppoInput.customerId,
            customer_name: ppoInput.customerName,
            requested_qty: ppoInput.requestedQty
        })
            .from(ppoInput)
            .where(and(eq(ppoInput.productId, pivot.productId as bigint), eq(ppoInput.stage, 'Pending')))
            .orderBy(ppoInput.orderId);

        // Convert bigints to strings for JSON serialization
        return rows.map(r => ({
            ...r,
            id: r.id?.toString(),
            order_id: r.order_id?.toString(),
            customer_id: r.customer_id?.toString()
        }));
    }

    /**
     * Update allocation details
     */
    async updateAllocation(
        pendingItemId: string,
        data: {
            orderedQty?: number;
            stockQty?: number;
            offerQty?: number;
            itemNameChange?: string;
            decidedSupplierName?: string;
            allocatorNotes?: string;
            notes?: string;
            done?: boolean;
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
                    orderedQty: data.orderedQty ?? item.orderedQty,
                    stockQty: data.stockQty ?? item.stockQty,
                    offerQty: data.offerQty ?? item.offerQty,
                    itemNameChange: data.itemNameChange ?? item.itemNameChange,
                    allocationDetails: data.notes ?? item.allocationDetails,
                    allocationStatus: data.done ? 'DONE' : item.allocationStatus,
                    locked: data.done ? true : item.locked,
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
