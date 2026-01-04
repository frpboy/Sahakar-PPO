import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './packages/database/src/schema.ts',
    out: './packages/database/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgres://postgres:Zabnix2025@34.100.175.185:5432/postgres'
    }
});
