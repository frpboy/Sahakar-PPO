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
                        like(products.name, `%${search}%`),
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
            .where(eq(products.id, BigInt(id)));
        return result[0] || null;
    }

    async create(data: {
        legacyId?: string;
        productCode?: string;
        itemName: string;
        aliasName?: string;
        packing?: string;
        category?: string;
        subcategory?: string;
        genericName?: string;
        patent?: string;
        hsnCode?: string;
        productType?: string;
        mrp?: number | string;
        ptr?: number | string;
        pts?: number | string;
        landedCost?: number | string;
        gstPercent?: number | string;
        discountPercent?: number | string;
        stock?: number;
        primarySupplierId?: string;
        secondarySupplierId?: string;
        repId?: string;
    }) {
        const createData: any = { ...data };
        ['mrp', 'ptr', 'pts', 'landedCost', 'gstPercent', 'discountPercent'].forEach(field => {
            if (typeof createData[field] === 'string' && createData[field] !== '') {
                createData[field] = parseFloat(createData[field]);
            }
        });

        const result = await db.insert(products).values(createData).returning();
        return result[0];
    }

    async update(id: string, data: {
        legacyId?: string;
        productCode?: string;
        itemName?: string;
        aliasName?: string;
        packing?: string;
        category?: string;
        subcategory?: string;
        genericName?: string;
        patent?: string;
        hsnCode?: string;
        productType?: string;
        mrp?: number | string;
        ptr?: number | string;
        pts?: number | string;
        landedCost?: number | string;
        gstPercent?: number | string;
        discountPercent?: number | string;
        stock?: number;
        primarySupplierId?: string;
        secondarySupplierId?: string;
        repId?: string;
        active?: boolean;
    }) {
        const updateData: any = { ...data, updatedAt: new Date() };
        ['mrp', 'ptr', 'pts', 'landedCost', 'gstPercent', 'discountPercent'].forEach(field => {
            if (typeof updateData[field] === 'string' && updateData[field] !== '') {
                updateData[field] = parseFloat(updateData[field]);
            }
        });

        const result = await db
            .update(products)
            .set(updateData)
            .where(eq(products.id, BigInt(id)))
            .returning();
        return result[0] || null;
    }

    async delete(id: string) {
        // Soft delete by setting active = false
        return await this.update(id, { active: false });
    }
}
