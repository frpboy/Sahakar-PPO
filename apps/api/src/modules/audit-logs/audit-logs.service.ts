import { Injectable } from '@nestjs/common';
import { db, auditEvents } from '@sahakar/database';
import { eq, like, and } from 'drizzle-orm';

@Injectable()
export class AuditLogsService {
    async findAll(filters?: {
        entityType?: string;
        action?: string;
        actor?: string;
    }) {
        let query = db.select().from(auditEvents);

        if (filters) {
            const conditions = [];
            if (filters.entityType) {
                conditions.push(eq(auditEvents.entityType, filters.entityType));
            }
            if (filters.action) {
                conditions.push(like(auditEvents.action, `%${filters.action}%`));
            }
            if (filters.actor) {
                conditions.push(like(auditEvents.actor, `%${filters.actor}%`));
            }
            if (conditions.length > 0) {
                query = query.where(and(...conditions)) as any;
            }
        }

        return await query;
    }
}
