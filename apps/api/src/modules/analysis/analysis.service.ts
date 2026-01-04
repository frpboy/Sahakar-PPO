import { Injectable } from '@nestjs/common';
import { db } from '@sahakar/database';
import { ppoInput, orderSlips, repOrders, auditLogs } from '@sahakar/database';
import { count, eq, desc, sql } from 'drizzle-orm';

@Injectable()
export class AnalysisService {
    async getStats() {
        const [rawCount] = await db.select({ value: count() }).from(ppoInput);
        const [pendingCount] = await db.select({ value: count() }).from(ppoInput).where(eq(ppoInput.status, 'RAW'));
        const [repCount] = await db.select({ value: count() }).from(repOrders);
        const [slipCount] = await db.select({ value: count() }).from(orderSlips);

        // Mocking some values for now as real data might not exist for all
        return {
            raw: rawCount.value,
            pending: pendingCount.value,
            rep_allocation: repCount.value,
            slip_generated: slipCount.value,
            executed: 150 // Placeholder
        };
    }

    async getLedger(limit: number = 50) {
        return db.select()
            .from(auditLogs)
            .orderBy(desc(auditLogs.eventDatetime))
            .limit(limit);
    }

    async getGapAnalysis() {
        // Find items where qtyReceived < qty
        return db.select()
            .from(ppoInput)
            .where(sql`${ppoInput.qtyReceived} < ${ppoInput.qty}`)
            .limit(20);
    }

    async getSupplierReliability() {
        // Group by supplier and calculate fill rate
        return db.select({
            supplier: ppoInput.supplier,
            totalOrders: count(),
            avgFillRate: sql<number>`AVG(${ppoInput.qtyReceived} / ${ppoInput.qty}) * 100`
        })
            .from(ppoInput)
            .groupBy(ppoInput.supplier);
    }

    async getFraudAlerts() {
        // Example: items changed after being received
        return [];
    }

    async getAgingReport() {
        // Orders pending for more than X days
        return [];
    }
}
