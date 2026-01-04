
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';
import { db, users } from '@sahakar/database';
import { eq } from 'drizzle-orm';
import { ConfigModule } from '@nestjs/config';

async function checkUser() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const email = 'frpboy12@gmail.com';
    console.log(`Checking for user: ${email}`);

    try {
        const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
        console.log('User found:', user);
    } catch (e) {
        console.error('Error querying user:', e);
    }

    await app.close();
}

checkUser();
