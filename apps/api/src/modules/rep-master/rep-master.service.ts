import { Injectable } from '@nestjs/common';
import { db, repMaster } from '@sahakar/database';
import { eq, like, or } from 'drizzle-orm';

@Injectable()
export class RepMasterService {
    async findAll(search?: string) {
        if (search) {
            return await db
                .select()
                .from(repMaster)
                .where(
                    or(
                        like(repMaster.name, `%${search}%`),
                        like(repMaster.mobile, `%${search}%`),
                        like(repMaster.designation, `%${search}%`)
                    )
                );
        }
        return await db.select().from(repMaster);
    }

    async findOne(id: string) {
        const result = await db
            .select()
            .from(repMaster)
            .where(eq(repMaster.id, BigInt(id)));
        return result[0] || null;
    }

    async create(data: {
        name: string;
        mobile?: string;
        email?: string;
        designation?: string;
    }) {
        const result = await db.insert(repMaster).values(data).returning();
        return result[0];
    }

    async update(id: string, data: {
        name?: string;
        mobile?: string;
        email?: string;
        designation?: string;
        active?: boolean;
    }) {
        const result = await db
            .update(repMaster)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(repMaster.id, BigInt(id)))
            .returning();
        return result[0] || null;
    }

    async delete(id: string) {
        return await this.update(id, { active: false });
    }
}
