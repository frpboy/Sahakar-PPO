import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { OrderStage } from '@sahakar/database';

@Injectable()
export class RepItemsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.repItem.findMany({
            where: {
                pendingItem: {
                    orderRequest: {
                        stage: OrderStage.REP_ALLOCATION
                    }
                }
            },
            include: {
                pendingItem: {
                    include: {
                        orderRequest: true
                    }
                }
            },
            orderBy: {
                pendingItem: {
                    orderRequest: {
                        productName: 'asc'
                    }
                }
            }
        });
    }

    async updateAllocation(id: string, data: any) {
        // id is RepItem id
        const repItem = await this.prisma.repItem.findUnique({
            where: { id },
            include: { pendingItem: true }
        });

        if (!repItem) throw new NotFoundException('Rep item not found');

        // We update the underlying PendingItem quantities as they are the source of truth for "Ordered" vs "Stock"
        const { orderedQty, stockQty, offerQty, notes, orderStatus } = data;

        return this.prisma.$transaction([
            this.prisma.pendingItem.update({
                where: { id: repItem.pendingItemId },
                data: {
                    orderedQty: orderedQty !== undefined ? Number(orderedQty) : undefined,
                    stockQty: stockQty !== undefined ? Number(stockQty) : undefined,
                    offerQty: offerQty !== undefined ? Number(offerQty) : undefined,
                    notes: notes
                }
            }),
            this.prisma.repItem.update({
                where: { id },
                data: {
                    orderStatus: orderStatus
                }
            })
        ]);
    }
}
