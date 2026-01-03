import { PrismaService } from '../../prisma.service';
export declare class PendingItemsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): unknown;
    update(id: string, data: any): unknown;
    moveToRep(id: string, userEmail: string): unknown;
}
