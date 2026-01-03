import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users, suppliers, products, orderRequests, pendingItems } from '@sahakar/database';
import { eq } from 'drizzle-orm';
import * as schema from '@sahakar/database';

@Injectable()
export class DrizzleExampleService {
    constructor(@Inject('DATABASE') private db: NodePgDatabase<typeof schema>) { }

    // Example: Get all users
    async getAllUsers() {
        return await this.db.select().from(users);
    }

    // Example: Get user by email
    async getUserByEmail(email: string) {
        const result = await this.db.select().from(users).where(eq(users.email, email));
        return result[0];
    }

    // Example: Create a new supplier
    async createSupplier(data: typeof suppliers.$inferInsert) {
        const result = await this.db.insert(suppliers).values(data).returning();
        return result[0];
    }

    // Example: Get pending items with product details
    async getPendingItemsWithProducts() {
        return await this.db
            .select({
                id: pendingItems.id,
                reqQty: pendingItems.reqQty,
                orderedQty: pendingItems.orderedQty,
                productName: products.itemName,
                productCode: products.productCode
            })
            .from(pendingItems)
            .leftJoin(products, eq(pendingItems.productId, products.id));
    }

    // Example: Complex audit query (showing SQL builder power)
    async getOrderRequestsBySupplier(supplierName: string) {
        return await this.db
            .select()
            .from(orderRequests)
            .where(eq(orderRequests.primarySupplier, supplierName))
            .orderBy(orderRequests.createdAt);
    }
}
