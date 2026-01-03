import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { PrismaService } from '../../prisma.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('me')
    @UseGuards(FirebaseAuthGuard)
    async getMe(@Req() req: any) {
        // req.user contains the decoded Firebase token
        const email = req.user.email;
        const user = await this.prisma.user.findUnique({
            where: { email }
        });
        return user;
    }
}
