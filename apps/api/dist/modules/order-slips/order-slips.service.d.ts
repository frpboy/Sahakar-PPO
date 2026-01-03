import { PrismaService } from '../../prisma.service';
export declare enum ItemStatus {
    PENDING = "PENDING",
    BILLED = "BILLED",
    NOT_BILLED = "NOT_BILLED",
    PARTIALLY_BILLED = "PARTIALLY_BILLED",
    PRODUCT_CHANGED = "PRODUCT_CHANGED",
    SUPPLIER_ITEM_DAMAGED = "SUPPLIER_ITEM_DAMAGED",
    SUPPLIER_ITEM_MISSING = "SUPPLIER_ITEM_MISSING"
}
export declare class OrderSlipsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): unknown;
    findOne(id: string): unknown;
    generateSlips(userEmail: string): unknown;
}
