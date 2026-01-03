import { PrismaService } from '../../prisma.service';
export declare class SlipItemsService {
    private prisma;
    constructor(prisma: PrismaService);
    updateStatus(id: string, data: any, userEmail: string): Promise<{
        id: string;
        orderSlipId: string | null;
        customerId: string | null;
        orderId: string | null;
        productId: string | null;
        itemNameSnapshot: string | null;
        qty: number;
        remarks: string | null;
        currentStatus: string | null;
        version: number;
        createdAt: Date;
    }>;
}
