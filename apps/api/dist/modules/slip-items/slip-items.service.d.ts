import { PrismaService } from '../../prisma.service';
export declare class SlipItemsService {
    private prisma;
    constructor(prisma: PrismaService);
    updateStatus(id: string, data: any, userEmail: string): unknown;
}
