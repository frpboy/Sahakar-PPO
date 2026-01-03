import { PrismaService } from '../../prisma.service';
export declare class RepItemsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): unknown;
    updateAllocation(id: string, data: any): unknown;
}
