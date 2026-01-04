import { Injectable } from '@nestjs/common';
import { db, auditEvents } from '@sahakar/database';
import { sql } from 'drizzle-orm';

export interface ConflictResolution {
    entityType: string;
    entityId: string;
    localVersion: any;
    serverVersion: any;
    resolution: 'KEEP_LOCAL' | 'KEEP_SERVER' | 'MANUAL_MERGE';
    resolvedBy: string;
    reason: string;
}

@Injectable()
export class ConflictService {
    /**
     * Workflow 6: Offline Conflict Resolution
     * 
     * Rules:
     * - Row version mismatch detection
     * - Head-only resolution UI
     * - Mandatory reason logging
     */
    async resolveConflict(
        conflict: ConflictResolution,
        userEmail: string
    ) {
        return await db.transaction(async (tx) => {
            // Verify user is HEAD role
            const user = await tx.execute(
                sql`SELECT role FROM users WHERE email = ${userEmail}`
            );

            if (!user.rows.length) {
                throw new Error('User not found');
            }

            const userRole = (user.rows[0] as any).role;

            if (!['PROCUREMENT_HEAD', 'BILLING_HEAD', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
                throw new Error('Only HEAD roles can resolve conflicts');
            }

            if (!conflict.reason || conflict.reason.trim().length < 10) {
                throw new Error('Conflict resolution requires a detailed reason (min 10 characters)');
            }

            // Log conflict resolution as audit event
            await tx.insert(auditEvents).values({
                entityType: `CONFLICT_${conflict.entityType}`,
                entityId: conflict.entityId,
                action: `RESOLVE_${conflict.resolution}`,
                beforeState: JSON.stringify({
                    local: conflict.localVersion,
                    server: conflict.serverVersion
                }),
                afterState: JSON.stringify({
                    resolution: conflict.resolution,
                    reason: conflict.reason
                }),
                actor: userEmail
            });

            // Apply resolution based on strategy
            // (Actual application logic would be in specific entity services)

            return {
                success: true,
                message: 'Conflict resolved successfully'
            };
        });
    }

    /**
     * Detect conflicts for offline sync
     */
    async detectConflicts(
        entityType: string,
        entityId: string,
        localTimestamp: Date,
        serverTimestamp: Date
    ) {
        if (localTimestamp.getTime() !== serverTimestamp.getTime()) {
            return {
                hasConflict: true,
                message: 'Version mismatch detected - requires HEAD resolution'
            };
        }

        return {
            hasConflict: false
        };
    }
}
