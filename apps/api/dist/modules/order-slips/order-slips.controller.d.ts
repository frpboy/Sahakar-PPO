import { OrderSlipsService } from './order-slips.service';
export declare class OrderSlipsController {
    private readonly service;
    constructor(service: OrderSlipsService);
    findAll(): Promise<({
        supplier: {
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
        _count: {
            items: number;
        };
    } & {
        id: string;
        supplierId: string | null;
        slipDate: Date;
        generatedBy: string | null;
        generatedAt: Date;
        regeneratedFrom: string | null;
    })[]>;
    findOne(id: string): Promise<{
        supplier: {
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
        items: ({
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
        } & {
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
        })[];
    } & {
        id: string;
        supplierId: string | null;
        slipDate: Date;
        generatedBy: string | null;
        generatedAt: Date;
        regeneratedFrom: string | null;
    }>;
    generate(userEmail: string): Promise<{
        message: string;
        generated: number;
    }>;
}
