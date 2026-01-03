import { RepItemsService } from './rep-items.service';
export declare class RepItemsController {
    private readonly service;
    constructor(service: RepItemsService);
    findAll(): Promise<({
        pendingItem: {
            orderRequest: {
                id: string;
                rep: string | null;
                mobile: string | null;
                createdAt: Date;
                acceptDatetime: Date;
                customerId: string;
                orderId: string;
                productId: string;
                productName: string;
                packing: string | null;
                subcategory: string | null;
                primarySupplier: string | null;
                secondarySupplier: string | null;
                mrp: import("@prisma/client/runtime/library").Decimal | null;
                reqQty: number;
                stage: import(".prisma/client").$Enums.OrderStage;
                hash: string;
                createdBy: string;
            };
        } & {
            id: string;
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
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        pendingItemId: string;
        orderStatus: string | null;
        rep: string | null;
        mobile: string | null;
        movedBy: string;
        movedAt: Date;
    })[]>;
    update(id: string, body: any): Promise<[{
        id: string;
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
        createdAt: Date;
        updatedAt: Date;
    }, {
        id: string;
        pendingItemId: string;
        orderStatus: string | null;
        rep: string | null;
        mobile: string | null;
        movedBy: string;
        movedAt: Date;
    }]>;
}
