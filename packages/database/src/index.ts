import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:Zabnix2025@34.100.175.185:5432/postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Export all schema objects
export * from './schema';
drizzle(pool, { schema });

// Export types
export type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
export type { NodePgDatabase } from 'drizzle-orm/node-postgres';
