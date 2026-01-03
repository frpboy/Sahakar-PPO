import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { OrderStage } from '@sahakar/database';

@Injectable()
export class AnalysisService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        // 1. Stage Counts
        const stageCounts = await this.prisma.orderRequest.groupBy({
            by: ['stage'],
            _count: {
                stage: true
            }
        });

        const stats = {
            total: 0,
            raw: 0,
            pending: 0,
            rep_allocation: 0,
            slip_generated: 0,
            executed: 0
        };

        stageCounts.forEach(item => {
            stats.total += item._count.stage;
            if (item.stage === OrderStage.RAW_INGESTED) stats.raw = item._count.stage;
            if (item.stage === OrderStage.PENDING) stats.pending = item._count.stage;
            if (item.stage === OrderStage.REP_ALLOCATION) stats.rep_allocation = item._count.stage;
            if (item.stage === OrderStage.SLIP_GENERATED) stats.slip_generated = item._count.stage;
            if (item.stage === OrderStage.EXECUTED) stats.executed = item._count.stage;
        });

        return stats;
    }

    async getStatusLedger(limit: number = 20) {
        return this.prisma.statusEvent.findMany({
            take: limit,
            orderBy: { eventDatetime: 'desc' }
        });
    }

    // Gap Analysis: Show items where Ordered Qty > Received Qty (Potential Loss/Out of Stock)
    // This is complex as it spans OrderRequest -> PendingItem -> RepItem? -> OrderSlipItem -> StatusEvent
    // Actually, easiest is checking OrderSlipItems where status != BILLED or qtyReceived < qty
    async getGapAnalysis() {
        return this.prisma.orderSlipItem.findMany({
            where: {
                OR: [
                    { status: { not: 'BILLED' } },
                    { qtyReceived: { lt: this.prisma.orderSlipItem.fields.qty } }
                ]
            },
            include: {
                orderSlip: true
            },
            take: 50,
            orderBy: { updatedAt: 'desc' }
        });
    }
}
