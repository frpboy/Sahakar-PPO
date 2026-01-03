import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { OrderStage } from '@sahakar/database';

@Injectable()
export class PendingItemsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.pendingItem.findMany({
            where: {
                orderRequest: {
                    stage: OrderStage.PENDING
                }
            },
            include: {
                orderRequest: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async update(id: string, data: any) {
        // Only allow specific fields to be updated
        const { orderedQty, stockQty, offerQty, notes, decidedSupplier } = data;

        return this.prisma.pendingItem.update({
            where: { id },
            data: {
                orderedQty: orderedQty !== undefined ? Number(orderedQty) : undefined,
                stockQty: stockQty !== undefined ? Number(stockQty) : undefined,
                offerQty: offerQty !== undefined ? Number(offerQty) : undefined,
                notes,
                decidedSupplier
            }
        });
    }

    async moveToRep(id: string, userEmail: string) {
        const item = await this.prisma.pendingItem.findUnique({
            where: { id },
            include: { orderRequest: true }
        });

        if (!item) throw new NotFoundException('Pending item not found');

        // Transactional move
        return this.prisma.$transaction(async (tx) => {
            // 1. Create Rep Item
            await tx.repItem.create({
                data: {
                    pendingItemId: item.id,
                    orderStatus: 'ALLOCATED',
                    movedBy: userEmail,
                    rep: item.orderRequest.rep, // Propagate rep if exists
                    mobile: item.orderRequest.mobile
                }
            });

            // 2. Mark Pending Item set as moved (flag)
            await tx.pendingItem.update({
                where: { id: item.id },
                data: { moveToRep: true }
            });

            // 3. Update Order Request Stage
            await tx.orderRequest.update({
                where: { id: item.orderRequestId },
                data: { stage: OrderStage.REP_ALLOCATION }
            });

            return { success: true };
        });
    }
}
