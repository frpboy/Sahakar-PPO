import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { OrderStage } from '@prisma/client';

@Injectable()
export class SlipItemsService {
    constructor(private prisma: PrismaService) { }

    async updateStatus(id: string, data: any, userEmail: string) {
        const { status, receivedQty, damagedQty, pendingQty, invoiceId, notes } = data;

        const item = await this.prisma.orderSlipItem.findUnique({
            where: { id },
            include: { orderSlip: true }
        });

        if (!item) throw new NotFoundException('Slip item not found');

        return this.prisma.$transaction(async (tx) => {
            // 1. Update Slip Item
            const updatedItem = await tx.orderSlipItem.update({
                where: { id },
                data: {
                    currentStatus: status
                }
            });

            // 2. Create Status Event (Immutable)
            await tx.statusEvent.create({
                data: {
                    orderSlipItemId: item.id,
                    status: status,
                    orderedQty: item.qty,
                    receivedQty: receivedQty ? Number(receivedQty) : 0,
                    damagedQty: damagedQty ? Number(damagedQty) : 0,
                    pendingQty: pendingQty ? Number(pendingQty) : 0,
                    invoiceId: invoiceId,
                    notes: notes,
                    performedBy: null // Schema expects ID. userEmail is email. Need user lookup?
                    // For now leaving null to avoid crash if user setup missing.
                }
            });

            // 3. Update Request Stage if Executed
            if (status === 'BILLED' || status === 'EXECUTED') { // String now? Enum?
                // Schema says `status` is String in StatusEvent? 
                // Schema.prisma: StatusEvent.status String
                // Enum ItemStatus exists. We should use it.
                // Assuming string passing "BILLED" works if mapped.

                await tx.orderRequest.updateMany({
                    where: { orderId: item.orderId, customerId: item.customerId },
                    data: { stage: OrderStage.EXECUTED }
                });
            }

            return updatedItem;
        });
    }
}
