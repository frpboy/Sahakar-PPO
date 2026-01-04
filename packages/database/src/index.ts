import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create PostgreSQL connection pool
let pool: Pool;
let dbInstance: NodePgDatabase<typeof schema>;

function getDb() {
    if (!dbInstance) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgres://postgres:Zabnix2025@34.100.175.185:5432/postgres',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        dbInstance = drizzle(pool, { schema });
    }
    return dbInstance;
}

// Export lazy db instance using Proxy
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
    get: (target, prop) => {
        return getDb()[prop as keyof NodePgDatabase<typeof schema>];
    }
});

// Export all schema objects
export * from './schema';

// Export types
export type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
export type { NodePgDatabase } from 'drizzle-orm/node-postgres';
