import { Injectable } from '@nestjs/common';
import { db, dutySessions } from '@sahakar/database';
import { eq } from 'drizzle-orm';

@Injectable()
export class DutySessionsService {
    async findAll() {
        return await db.select().from(dutySessions);
    }

    async findActive() {
        return await db
            .select()
            .from(dutySessions)
            .where(eq(dutySessions.active, true));
    }
}
