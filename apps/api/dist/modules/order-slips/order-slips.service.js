"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OrderSlipsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderSlipsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const database_1 = require("@sahakar/database");
let OrderSlipsService = OrderSlipsService_1 = class OrderSlipsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(OrderSlipsService_1.name);
    }
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
    async findOne(id) {
        return this.prisma.orderSlip.findUnique({
            where: { id },
            include: {
                items: true
            }
        });
    }
    async generateSlips(userEmail) {
        this.logger.log(`Generating Order Slips by ${userEmail}`);
        const candidates = await this.prisma.pendingItem.findMany({
            where: {
                AND: [
                    { orderedQty: { gt: 0 } },
                    {
                        orderRequest: {
                            stage: { in: [database_1.OrderStage.PENDING, database_1.OrderStage.REP_ALLOCATION] }
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
        const grouped = new Map();
        for (const item of candidates) {
            const supplier = item.decidedSupplier || item.orderedSupplier;
            if (!grouped.has(supplier)) {
                grouped.set(supplier, []);
            }
            grouped.get(supplier).push(item);
        }
        let generatedCount = 0;
        await this.prisma.$transaction(async (tx) => {
            const today = new Date();
            for (const [supplier, items] of grouped) {
                const slip = await tx.orderSlip.create({
                    data: {
                        supplier,
                        slipDate: today,
                        createdBy: userEmail
                    }
                });
                generatedCount++;
                for (const item of items) {
                    await tx.orderSlipItem.create({
                        data: {
                            orderSlipId: slip.id,
                            customerId: item.orderRequest.customerId,
                            orderId: item.orderRequest.orderId,
                            itemName: item.itemNameChange || item.orderRequest.productName,
                            qty: item.orderedQty,
                            remarks: item.notes,
                            status: database_1.ItemStatus.PENDING
                        }
                    });
                    await tx.orderRequest.update({
                        where: { id: item.orderRequestId },
                        data: { stage: database_1.OrderStage.SLIP_GENERATED }
                    });
                }
            }
        });
        return { message: 'Slips generated successfully', generated: generatedCount, suppliers: Array.from(grouped.keys()) };
    }
};
exports.OrderSlipsService = OrderSlipsService;
exports.OrderSlipsService = OrderSlipsService = OrderSlipsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrderSlipsService);
//# sourceMappingURL=order-slips.service.js.map