import { Injectable } from '@nestjs/common';
import { db, orderSlipItems, statusEvents, auditEvents, dutySessions, users } from '@sahakar/database';
import { sql, eq, and } from 'drizzle-orm';

@Injectable()
export class BillingService {
    /**
     * Workflow 5: Billing Status Update
     * 
     * Rules:
     * - Status enum enforcement
     * - Duty session validation
     * - Append-only status_events
     * - BILLING_HEAD override capability
     */
    async updateBillingStatus(
        orderSlipItemId: string,
        data: {
            status: string;
            qtyReceived?: number;
            qtyDamaged?: number;
            qtyPending?: number;
            invoiceId?: string;
            notes?: string;
        },
        userEmail: string
    ) {
        return await db.transaction(async (tx) => {
            // Get user
            const usersResult = await tx.select().from(users).where(eq(users.email, userEmail)).limit(1);

            if (!usersResult.length) {
                throw new Error('User not found');
            }

            const user = usersResult[0];

            // Check duty session for BILLING_STAFF
            if (user.role === 'BILLING_STAFF') {
                const activeSessions = await tx
                    .select()
                    .from(dutySessions)
                    .where(
                        and(
                            eq(dutySessions.userId, user.id),
                            eq(dutySessions.active, true)
                        )
                    );

                if (!activeSessions.length) {
                    throw new Error('No active duty session - BILLING_STAFF must clock in');
                }
            }

            // Get current slip item
            const items = await tx.select().from(orderSlipItems).where(eq(orderSlipItems.id, BigInt(orderSlipItemId))).limit(1);

            if (!items.length) {
                throw new Error('Order slip item not found');
            }

            const item = items[0];

            // Update slip item status
            await tx.update(orderSlipItems)
                .set({
                    status: data.status as any,
                    invoiceId: data.invoiceId,
                    notes: data.notes
                })
                .where(eq(orderSlipItems.id, BigInt(orderSlipItemId)));

            // Append-only status event
            await tx.insert(statusEvents).values({
                entityType: 'SLIP_ITEM',
                entityId: BigInt(orderSlipItemId),
                oldStatus: item.status || 'Pending',
                newStatus: data.status,
                note: data.notes || `Updated via billing. Received: ${data.qtyReceived || 0}`,
                createdBy: userEmail
            });

            // Audit event
            await tx.insert(auditEvents).values({
                entityType: 'ORDER_SLIP_ITEM',
                entityId: BigInt(orderSlipItemId),
                action: 'UPDATE_BILLING_STATUS',
                payload: {
                    before: item,
                    after: { ...item, status: data.status, invoiceId: data.invoiceId },
                    input: data
                },
                actor: userEmail
            });

            return { success: true };
        });
    }

    /**
     * Start duty session for billing staff
     */
    async startDutySession(userEmail: string) {
        return await db.transaction(async (tx) => {
            const usersResult = await tx.select().from(users).where(eq(users.email, userEmail)).limit(1);

            if (!usersResult.length) {
                throw new Error('User not found');
            }

            const user = usersResult[0];

            if (user.role !== 'BILLING_STAFF' && user.role !== 'BILLING_HEAD') {
                throw new Error('Only billing staff can start duty sessions');
            }

            // End any active sessions first
            await tx.update(dutySessions)
                .set({ active: false, endTime: new Date() })
                .where(
                    and(
                        eq(dutySessions.userId, user.id),
                        eq(dutySessions.active, true)
                    )
                );

            // Start new session
            await tx.insert(dutySessions).values({
                userId: user.id,
                active: true
            });

            return { success: true };
        });
    }

    async endDutySession(userEmail: string) {
        return await db.transaction(async (tx) => {
            const usersResult = await tx.select().from(users).where(eq(users.email, userEmail)).limit(1);

            if (!usersResult.length) {
                throw new Error('User not found');
            }

            const user = usersResult[0];

            await tx.update(dutySessions)
                .set({ active: false, endTime: new Date() })
                .where(
                    and(
                        eq(dutySessions.userId, user.id),
                        eq(dutySessions.active, true)
                    )
                );

            return { success: true };
        });
    }
}
