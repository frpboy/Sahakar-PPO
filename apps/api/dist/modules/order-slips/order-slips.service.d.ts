import { PrismaService } from '../../prisma.service';
export declare class OrderSlipsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        _count: {
            items: number;
        };
    } & {
        id: string;
        supplier: string;
        slipDate: Date;
        createdBy: string;
        createdAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        items: {
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
        }[];
    } & {
        id: string;
        supplier: string;
        slipDate: Date;
        createdBy: string;
        createdAt: Date;
    }>;
    generateSlips(userEmail: string): Promise<{
        message: string;
        generated: number;
        suppliers?: undefined;
    } | {
        message: string;
        generated: number;
        suppliers: string[];
    }>;
}
