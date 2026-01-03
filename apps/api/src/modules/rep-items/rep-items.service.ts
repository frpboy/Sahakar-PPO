import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { OrderStage } from '@prisma/client';

@Injectable()
export class RepItemsService { // Keeping class name same
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.repOrder.findMany({
            where: {
                poPendingItem: {
                    orderRequest: {
                        stage: OrderStage.REP_ALLOCATION
                    }
                }
            },
            include: {
                poPendingItem: {
                    include: {
                        orderRequest: true,
                        product: true
                    }
                },
                orderedSupplier: true,
                rep: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async updateAllocation(id: string, data: any) {
        // Here we assign Reps
        const { repId, notes } = data;

        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.repOrder.update({
                where: { id },
                data: {
                    repId: repId,
                    notes: notes
                }
            });

            // Confirm Allocation? Or is it dynamic? 
            // Audit Log
            await tx.auditEvent.create({
                data: {
                    entityType: 'RepOrder',
                    entityId: id,
                    action: 'ASSIGN_REP',
                    afterState: data,
                    // actor: 'system'
                }
            });

            return updated;
        });
    }
}
