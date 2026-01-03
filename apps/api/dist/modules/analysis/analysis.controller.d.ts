import { AnalysisService } from './analysis.service';
export declare class AnalysisController {
    private readonly service;
    constructor(service: AnalysisService);
    getStats(): Promise<{
        total: number;
        raw: number;
        pending: number;
        rep_allocation: number;
        slip_generated: number;
        executed: number;
    }>;
    getLedger(limit: string): Promise<{
        id: string;
        eventDatetime: Date;
        supplier: string;
        customerId: string;
        orderId: string;
        itemOld: string | null;
        itemNew: string | null;
        qty: number | null;
        status: import(".prisma/client").$Enums.ItemStatus | null;
        receivedQty: number | null;
        badQty: number | null;
        pendingQty: number | null;
        invoiceId: string | null;
        notes: string | null;
        staff: string;
    }[]>;
    getGap(): Promise<({
        orderSlip: {
            id: string;
            supplier: string;
            slipDate: Date;
            createdBy: string;
            createdAt: Date;
        };
    } & {
        id: string;
        customerId: string;
        orderId: string;
        qty: number;
        status: import(".prisma/client").$Enums.ItemStatus;
        invoiceId: string | null;
        notes: string | null;
        orderSlipId: string;
        itemName: string;
        remarks: string | null;
        qtyReceived: number;
        qtyDamaged: number;
        qtyPending: number;
        newItemName: string | null;
        updatedBy: string | null;
        updatedAt: Date;
    })[]>;
}
