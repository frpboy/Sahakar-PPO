import { PrismaService } from '../../prisma.service';
export declare class AnalysisService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<{
        total: number;
        raw: number;
        pending: number;
        rep_allocation: number;
        slip_generated: number;
        executed: number;
    }>;
    getStatusLedger(limit?: number): Promise<{
        id: string;
        orderSlipItemId: string | null;
        eventTime: Date;
        status: string;
        orderedQty: number | null;
        receivedQty: number | null;
        damagedQty: number | null;
        missingQty: number | null;
        pendingQty: number | null;
        invoiceId: string | null;
        oldItemName: string | null;
        newItemName: string | null;
        notes: string | null;
        performedBy: string | null;
        dutySessionId: string | null;
        override: boolean;
        overrideReason: string | null;
    }[]>;
    getGapAnalysis(): Promise<({
        orderSlip: {
            id: string;
            supplierId: string | null;
            slipDate: Date;
            generatedBy: string | null;
            generatedAt: Date;
            regeneratedFrom: string | null;
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
    })[]>;
}
