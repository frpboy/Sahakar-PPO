import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { db, users } from '@sahakar/database';
import { eq } from 'drizzle-orm';

@Controller('auth')
export class AuthController {
    constructor() { }

    @Get('me')
    @UseGuards(FirebaseAuthGuard)
    async getMe(@Req() req: any) {
        // req.user contains the decoded Firebase token
        const email = req.user.email;
        const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return user[0] || { role: null };
    }
}
