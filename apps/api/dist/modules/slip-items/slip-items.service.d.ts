import { PrismaService } from '../../prisma.service';
export declare class SlipItemsService {
    private prisma;
    constructor(prisma: PrismaService);
    updateStatus(id: string, data: any, userEmail: string): Promise<{
        id: string;
        orderSlipId: string;
        customerId: string;
        orderId: string;
        itemName: string;
        qty: number;
        remarks: string | null;
        status: import(".prisma/client").$Enums.ItemStatus;
        qtyReceived: number;
        qtyDamaged: number;
        qtyPending: number;
        invoiceId: string | null;
        newItemName: string | null;
        notes: string | null;
        updatedBy: string | null;
        updatedAt: Date;
    }>;
}
