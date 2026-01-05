import { Injectable } from '@nestjs/common';
import { db, suppliers } from '@sahakar/database';
import { eq, like, or } from 'drizzle-orm';

@Injectable()
export class SuppliersService {
    async findAll(search?: string) {
        if (search) {
            return await db
                .select()
                .from(suppliers)
                .where(
                    or(
                        like(suppliers.supplierName, `%${search}%`),
                        like(suppliers.supplierCode, `%${search}%`),
                        like(suppliers.contactPerson, `%${search}%`)
                    )
                );
        }
        return await db.select().from(suppliers);
    }

    async findOne(id: string) {
        const result = await db
            .select()
            .from(suppliers)
            .where(eq(suppliers.id, BigInt(id)));
        return result[0] || null;
    }

    async create(data: {
        supplierCode?: string;
        supplierName: string;
        contactPerson?: string;
        mobile?: string;
        email?: string;
        gstNumber?: string;
        address?: string;
        creditDays?: number | string;
    }) {
        const createData: any = { ...data };
        if (typeof createData.creditDays === 'string') {
            createData.creditDays = parseInt(createData.creditDays);
        }
        const result = await db.insert(suppliers).values(createData).returning();
        return result[0];
    }

    async update(id: string, data: {
        supplierCode?: string;
        supplierName?: string;
        contactPerson?: string;
        mobile?: string;
        email?: string;
        gstNumber?: string;
        address?: string;
        creditDays?: number | string;
        active?: boolean;
    }) {
        const updateData: any = { ...data, updatedAt: new Date() };
        if (typeof updateData.creditDays === 'string') {
            updateData.creditDays = parseInt(updateData.creditDays);
        }
        const result = await db
            .update(suppliers)
            .set(updateData)
            .where(eq(suppliers.id, BigInt(id)))
            .returning();
        return result[0] || null;
    }

    async delete(id: string) {
        return await this.update(id, { active: false });
    }
}
