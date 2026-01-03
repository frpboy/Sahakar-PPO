import { PendingItemsService } from './pending-items.service';
export declare class PendingItemsController {
    private readonly service;
    constructor(service: PendingItemsService);
    findAll(): Promise<({
        product: {
            id: string;
            createdAt: Date;
            productCode: string | null;
            itemName: string;
            packing: string | null;
            category: string | null;
            subcategory: string | null;
            mrp: import("@prisma/client/runtime/library").Decimal | null;
            active: boolean;
            updatedAt: Date;
        };
        orderRequest: {
            id: string;
            customerId: string | null;
            orderId: string | null;
            productId: string | null;
            createdAt: Date;
            mrp: import("@prisma/client/runtime/library").Decimal | null;
            inputFileId: string | null;
            acceptDate: Date | null;
            acceptTime: Date | null;
            productNameSnapshot: string | null;
            reqQty: number | null;
            stage: import(".prisma/client").$Enums.OrderStage;
            primarySupplier: string | null;
            secondarySupplier: string | null;
            hash: string | null;
        };
        decidedSupplier: {
            id: string;
            createdAt: Date;
            active: boolean;
            updatedAt: Date;
            supplierCode: string | null;
            supplierName: string;
            contactPerson: string | null;
            mobile: string | null;
            email: string | null;
            gstNumber: string | null;
            address: string | null;
            creditDays: number | null;
            createdBy: string | null;
        };
    } & {
        id: string;
        orderedQty: number;
        productId: string | null;
        version: number;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        orderRequestId: string | null;
        totalReqQty: number;
        stockQty: number;
        offerQty: number;
        allocatorNotes: string | null;
        decidedSupplierId: string | null;
        done: boolean;
        movedToRep: boolean;
    })[]>;
    update(id: string, body: any): Promise<{
        id: string;
        orderedQty: number;
        productId: string | null;
        version: number;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        orderRequestId: string | null;
        totalReqQty: number;
        stockQty: number;
        offerQty: number;
        allocatorNotes: string | null;
        decidedSupplierId: string | null;
        done: boolean;
        movedToRep: boolean;
    }>;
    moveToRep(id: string, userEmail: string): Promise<{
        success: boolean;
    }>;
}
