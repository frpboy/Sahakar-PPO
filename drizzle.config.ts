import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    schema: './packages/database/src/schema.ts',
    out: './packages/database/migrations',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgres://postgres:Zabnix2025@34.100.175.185:5432/postgres'
    }
});
