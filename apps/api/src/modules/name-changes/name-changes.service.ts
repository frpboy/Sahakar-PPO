import { Injectable } from '@nestjs/common';
import { db, productNameChanges, products, suppliers } from '@sahakar/database';
import { eq } from 'drizzle-orm';

@Injectable()
export class NameChangesService {
    async findAll() {
        const result = await db
            .select({
                id: productNameChanges.id,
                productId: productNameChanges.productId,
                supplierId: productNameChanges.supplierId,
                oldName: productNameChanges.oldName,
                newName: productNameChanges.newName,
                reason: productNameChanges.reason,
                effectiveFrom: productNameChanges.effectiveFrom,
                effectiveTo: productNameChanges.effectiveTo,
                active: productNameChanges.active,
                createdAt: productNameChanges.createdAt,
                productName: products.name,
                supplierName: suppliers.supplierName
            })
            .from(productNameChanges)
            .leftJoin(products, eq(productNameChanges.productId, products.id))
            .leftJoin(suppliers, eq(productNameChanges.supplierId, suppliers.id))
            .orderBy(productNameChanges.createdAt);

        return result;
    }

    async findByProduct(productId: string) {
        return await db
            .select()
            .from(productNameChanges)
            .where(eq(productNameChanges.productId, BigInt(productId)));
    }
}
