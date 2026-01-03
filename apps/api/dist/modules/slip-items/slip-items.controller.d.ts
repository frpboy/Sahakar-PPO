import { SlipItemsService } from './slip-items.service';
export declare class SlipItemsController {
    private readonly service;
    constructor(service: SlipItemsService);
    updateStatus(id: string, body: any): Promise<{
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
