import { SlipItemsService } from './slip-items.service';
export declare class SlipItemsController {
    private readonly service;
    constructor(service: SlipItemsService);
    updateStatus(id: string, body: any): Promise<{
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
