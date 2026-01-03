import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { OrderStage } from '@prisma/client';

export enum ItemStatus {
    PENDING = 'PENDING',
    BILLED = 'BILLED',
    NOT_BILLED = 'NOT_BILLED',
    PARTIALLY_BILLED = 'PARTIALLY_BILLED',
    PRODUCT_CHANGED = 'PRODUCT_CHANGED',
    SUPPLIER_ITEM_DAMAGED = 'SUPPLIER_ITEM_DAMAGED',
    SUPPLIER_ITEM_MISSING = 'SUPPLIER_ITEM_MISSING'
}

@Injectable()
export class OrderSlipsService {
    private readonly logger = new Logger(OrderSlipsService.name);

    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.orderSlip.findMany({
            include: {
                supplier: true,
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { generatedAt: 'desc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.orderSlip.findUnique({
            where: { id },
            include: {
                items: {
                    include: { product: true }
                },
                supplier: true
            }
        });
    }

    async generateSlips(userEmail: string) {
        // Candidates: RepOrders where Rep is assigned? 
        // Or PoPendingItems that are ready?
        // Logic: Move from Rep Stage to Slip Stage.
        // Candidates = PendingItems in REP_ALLOCATION stage.
        // We use RepOrders to determine Supplier?
        // Actually PoPendingItem has `decidedSupplierId`. RepOrder has `orderedSupplierId`.
        // Let's use RepOrders as the source.

        const candidates = await this.prisma.repOrder.findMany({
            where: {
                poPendingItem: {
                    orderRequest: {
                        stage: OrderStage.REP_ALLOCATION
                    }
                },
                orderedSupplierId: { not: null }
            },
            include: {
                poPendingItem: {
                    include: { orderRequest: true, product: true }
                },
                orderedSupplier: true
            }
        });

        if (candidates.length === 0) {
            return { message: 'No eligible items found', generated: 0 };
        }

        const grouped = new Map<string, typeof candidates>();

        for (const item of candidates) {
            const supplierId = item.orderedSupplierId!;
            if (!grouped.has(supplierId)) {
                grouped.set(supplierId, []);
            }
            grouped.get(supplierId)!.push(item);
        }

        let generatedCount = 0;

        await this.prisma.$transaction(async (tx) => {
            const today = new Date();

            for (const [supplierId, items] of grouped) {
                // Upsert Slip for today? Or simple create uniquely?
                // Schema has Unique(supplierId, slipDate).
                // So we find or create.

                let slip = await tx.orderSlip.findUnique({
                    where: {
                        supplierId_slipDate: {
                            supplierId,
                            slipDate: today // This comparison might fail if time component matches. 
                            // Prisma Date type usually ignores time if @db.Date is set.
                            // But usually safer to check range or ensure input is stripped.
                            // Let's rely on Create validation or Try/Catch if strict.
                            // Better: findFirst.
                        }
                    }
                });

                if (!slip) {
                    slip = await tx.orderSlip.create({
                        data: {
                            supplierId,
                            slipDate: today, // Ensure this is just YYYY-MM-DD
                            generatedBy: null // TODO: resolve user ID from email?
                        }
                    });
                }

                generatedCount++;

                for (const item of items) {
                    await tx.orderSlipItem.create({
                        data: {
                            orderSlipId: slip.id,
                            customerId: item.poPendingItem?.orderRequest?.customerId,
                            orderId: item.poPendingItem?.orderRequest?.orderId,
                            productId: item.productId,
                            itemNameSnapshot: item.poPendingItem?.product?.itemName,
                            qty: item.reqQty,
                            remarks: item.notes,
                            currentStatus: 'PENDING'
                        }
                    });

                    // Update Stage
                    if (item.poPendingItem?.orderRequestId) {
                        await tx.orderRequest.update({
                            where: { id: item.poPendingItem.orderRequestId },
                            data: { stage: OrderStage.SLIP_GENERATED }
                        });
                    }
                }
            }
        });

        return { message: 'Slips generated', generated: generatedCount };
    }
}
