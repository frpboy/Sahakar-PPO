import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { OrderStage } from '@prisma/client';

@Injectable()
export class PendingItemsService { // Keeping class name same to avoid Module refactor
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.poPendingItem.findMany({
            where: {
                orderRequest: {
                    stage: OrderStage.PENDING
                }
            },
            include: {
                orderRequest: true,
                product: true,
                decidedSupplier: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async update(id: string, data: any) {
        const { orderedQty, stockQty, offerQty, notes, decidedSupplierId } = data;

        return this.prisma.poPendingItem.update({
            where: { id },
            data: {
                orderedQty: orderedQty !== undefined ? Number(orderedQty) : undefined,
                stockQty: stockQty !== undefined ? Number(stockQty) : undefined,
                offerQty: offerQty !== undefined ? Number(offerQty) : undefined,
                allocatorNotes: notes,
                decidedSupplierId: decidedSupplierId
            }
        });
    }

    async moveToRep(id: string, userEmail: string) {
        const item = await this.prisma.poPendingItem.findUnique({
            where: { id },
            include: { orderRequest: true }
        });

        if (!item) throw new NotFoundException('Pending item not found');

        return this.prisma.$transaction(async (tx) => {
            // 1. Create Rep Order (was RepItem)
            await tx.repOrder.create({
                data: {
                    poPendingId: item.id,
                    productId: item.productId,
                    reqQty: item.orderedQty,
                    orderedSupplierId: item.decidedSupplierId,
                    notes: item.allocatorNotes,
                    // If rep logic existed in request, propagate it. For now assume manual assignment later?
                    // Or if deciding supplier implies rep?
                    // For strict logic, we just create the order.
                }
            });

            // 2. Mark Moved
            await tx.poPendingItem.update({
                where: { id: item.id },
                data: { movedToRep: true }
            });

            // 3. Update Request Stage
            if (item.orderRequestId) {
                await tx.orderRequest.update({
                    where: { id: item.orderRequestId },
                    data: { stage: OrderStage.REP_ALLOCATION }
                });
            }

            // 4. Audit
            await tx.auditEvent.create({
                data: {
                    entityType: 'PoPendingItem',
                    entityId: item.id,
                    action: 'MOVE_TO_REP',
                    beforeState: { moveToRep: false } as any,
                    afterState: { moveToRep: true } as any,
                    actor: { connect: { email: userEmail } }
                }
            });

            return { success: true };
        });
    }
}
