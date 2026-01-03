import { PrismaService } from '../../prisma.service';
export declare class AuthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMe(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        designation: string | null;
        role: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
