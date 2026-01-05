import { Injectable } from '@nestjs/common';
import { db, users } from '@sahakar/database';
import { eq, like, or } from 'drizzle-orm';

@Injectable()
export class UsersService {
    async findAll(search?: string) {
        if (search) {
            return await db
                .select()
                .from(users)
                .where(
                    or(
                        like(users.name, `%${search}%`),
                        like(users.email, `%${search}%`)
                    )
                );
        }
        return await db.select().from(users);
    }

    async findOne(id: string) {
        const result = await db.select().from(users).where(eq(users.id, BigInt(id)));
        return result[0] || null;
    }

    async update(id: string, data: {
        name?: string;
        role?: 'SUPER_ADMIN' | 'ADMIN' | 'PROCUREMENT_HEAD' | 'PURCHASE_STAFF' | 'BILLING_HEAD' | 'BILLING_STAFF';
        active?: boolean;
    }) {
        const result = await db
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, BigInt(id)))
            .returning();
        return result[0] || null;
    }
}
