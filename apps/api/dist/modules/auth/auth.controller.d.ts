import { PrismaService } from '../../prisma.service';
export declare class AuthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMe(req: any): unknown;
}
