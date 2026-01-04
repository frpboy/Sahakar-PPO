import { Injectable } from '@nestjs/common';
import { db, products } from '@sahakar/database';
import { eq, like, or } from 'drizzle-orm';

@Injectable()
export class ProductsService {
    async findAll(search?: string) {
        if (search) {
            return await db
                .select()
                .from(products)
                .where(
                    or(
                        like(products.itemName, `%${search}%`),
                        like(products.productCode, `%${search}%`),
                        like(products.legacyId, `%${search}%`)
                    )
                );
        }
        return await db.select().from(products);
    }

    async findOne(id: string) {
        const result = await db
            .select()
            .from(products)
            .where(eq(products.id, id));
        return result[0] || null;
    }

    async create(data: {
        legacyId?: string;
        productCode?: string;
        itemName: string;
        packing?: string;
        category?: string;
        subcategory?: string;
        mrp?: number | string;
    }) {
        const createData: any = { ...data };
        if (typeof createData.mrp === 'string') {
            createData.mrp = parseFloat(createData.mrp);
        }
        const result = await db.insert(products).values(createData).returning();
        return result[0];
    }

    async update(id: string, data: {
        legacyId?: string;
        productCode?: string;
        itemName?: string;
        packing?: string;
        category?: string;
        subcategory?: string;
        mrp?: number | string;
        active?: boolean;
    }) {
        const updateData: any = { ...data, updatedAt: new Date() };
        if (typeof updateData.mrp === 'string') {
            updateData.mrp = parseFloat(updateData.mrp);
        }
        const result = await db
            .update(products)
            .set(updateData)
            .where(eq(products.id, id))
            .returning();
        return result[0] || null;
    }

    async delete(id: string) {
        // Soft delete by setting active = false
        return await this.update(id, { active: false });
    }
}
