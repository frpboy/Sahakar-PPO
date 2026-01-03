import { PendingItemsService } from './pending-items.service';
export declare class PendingItemsController {
    private readonly service;
    constructor(service: PendingItemsService);
    findAll(): Promise<({
        orderRequest: {
            id: string;
            acceptDatetime: Date;
            customerId: string;
            orderId: string;
            productId: string;
            productName: string;
            packing: string | null;
            subcategory: string | null;
            primarySupplier: string | null;
            secondarySupplier: string | null;
            rep: string | null;
            mobile: string | null;
            mrp: import("@prisma/client/runtime/library").Decimal | null;
            reqQty: number;
            stage: import(".prisma/client").$Enums.OrderStage;
            hash: string;
            createdBy: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        orderRequestId: string;
        orderedQty: number | null;
        stockQty: number | null;
        offerQty: number | null;
        notes: string | null;
        itemNameChange: string | null;
        orderedSupplier: string | null;
        decidedSupplier: string | null;
        moveToRep: boolean;
        acceptDate: Date | null;
        updatedAt: Date;
    })[]>;
    update(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        orderRequestId: string;
        orderedQty: number | null;
        stockQty: number | null;
        offerQty: number | null;
        notes: string | null;
        itemNameChange: string | null;
        orderedSupplier: string | null;
        decidedSupplier: string | null;
        moveToRep: boolean;
        acceptDate: Date | null;
        updatedAt: Date;
    }>;
    moveToRep(id: string, userEmail: string): Promise<{
        success: boolean;
    }>;
}
