import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { OrderStage, ItemStatus } from '@sahakar/database';

@Injectable()
export class OrderSlipsService {
    private readonly logger = new Logger(OrderSlipsService.name);

    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.orderSlip.findMany({
            include: {
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.orderSlip.findUnique({
            where: { id },
            include: {
                items: true
            }
        });
    }

    async generateSlips(userEmail: string) {
        this.logger.log(`Generating Order Slips by ${userEmail}`);

        // 1. Find all eligible candidate items
        // Candidates are:
        // a) PendingItems (stage=PENDING) that have a decidedSupplier (implied ready if not moved to Rep?)
        //    Use heuristic: If decidedSupplier is set AND orderedQty > 0
        // b) RepItems (stage=REP_ALLOCATION, linked to PendingItem)
        //    The RepItem quantity is stored in PendingItem.orderedQty usually? 
        //    NOTE: Schema says RepItem has no qty, it links to PendingItem.
        //    But RepItem is "Split". Actually, one PendingItem -> Many RepItems? 
        //    Schema: PendingItem defines `orderedQty`. RepItem is a sub-record?
        //    Wait, schema: PendingItem 1-n RepItems?
        //    Yes: `repItems RepItem[]` in PendingItem.
        //    So if moved to Rep, the Allocation is per RepItem? but RepItem doesn't have Qty field in schema I wrote!
        //    Re-reading schema I wrote:
        //    model RepItem { id, pendingItemId, orderStatus, rep, mobile... } 
        //    It DOES NOT have qty. 
        //    "Allocation is done per product... Manual allocation overrides auto-split". 
        //    If multiple reps, we need qty per rep.
        //    My schema might be missing `allocatedQty` on RepItem if split happens?
        //    Or is PendingItem representing the total line, and RepItem is just "who handles it"?
        //    "Split bulk quantities per customer order"
        //    "Rep Allocation... Customer | Order | Req | Buy | Stk"
        //    The "Rep" view shows Customer orders. 
        //    Actually, `OrderRequest` has `customerId`. 
        //    So `PendingItem` is 1:1 with `OrderRequest`. 
        //    So `PendingItem` IS for one customer. 
        //    So "Rep Allocation" is just setting the Qty for that customer's request? 
        //    YES. "Allocation is done per product". "Row per customer".
        //    So `PendingItem.orderedQty` IS the allocated quantity.
        //    So taking `PendingItem` is sufficient. 
        //    Whether it went through Rep stage or not, the final qty is in `PendingItem.orderedQty`.

        // So candidates = All OrderRequests where (stage IN [PENDING, REP_ALLOCATION]) AND (orderedQty > 0).
        // We need to group these by Supplier.

        const candidates = await this.prisma.pendingItem.findMany({
            where: {
                AND: [
                    { orderedQty: { gt: 0 } },
                    {
                        orderRequest: {
                            stage: { in: [OrderStage.PENDING, OrderStage.REP_ALLOCATION] }
                        }
                    },
                    {
                        OR: [
                            { decidedSupplier: { not: null } },
                            { orderedSupplier: { not: null } }
                        ]
                    }
                ]
            },
            include: {
                orderRequest: true
            }
        });

        if (candidates.length === 0) {
            return { message: 'No eligible items found for slip generation', generated: 0 };
        }

        // 2. Group by Supplier
        const grouped = new Map<string, typeof candidates>();

        for (const item of candidates) {
            const supplier = item.decidedSupplier || item.orderedSupplier!;
            if (!grouped.has(supplier)) {
                grouped.set(supplier, []);
            }
            grouped.get(supplier)!.push(item);
        }

        // 3. Create OrderSlips in Transaction
        let generatedCount = 0;

        await this.prisma.$transaction(async (tx) => {
            const today = new Date(); // Slip Date

            for (const [supplier, items] of grouped) {
                // Create Slip
                const slip = await tx.orderSlip.create({
                    data: {
                        supplier,
                        slipDate: today,
                        createdBy: userEmail
                    }
                });

                generatedCount++;

                // Create Slip Items & Update Request Stage
                for (const item of items) {
                    await tx.orderSlipItem.create({
                        data: {
                            orderSlipId: slip.id,
                            customerId: item.orderRequest.customerId,
                            orderId: item.orderRequest.orderId,
                            itemName: item.itemNameChange || item.orderRequest.productName,
                            qty: item.orderedQty!, // Checked > 0 above
                            remarks: item.notes,
                            status: ItemStatus.PENDING
                        }
                    });

                    // Update Request Stage to SLIP_GENERATED
                    // Also ensures we don't pick it up again
                    await tx.orderRequest.update({
                        where: { id: item.orderRequestId },
                        data: { stage: OrderStage.SLIP_GENERATED }
                    });
                }
            }
        });

        return { message: 'Slips generated successfully', generated: generatedCount, suppliers: Array.from(grouped.keys()) };
    }
}
