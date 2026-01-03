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
exports.OrderSlipsService = exports.ItemStatus = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const client_1 = require("@prisma/client");
var ItemStatus;
(function (ItemStatus) {
    ItemStatus["PENDING"] = "PENDING";
    ItemStatus["BILLED"] = "BILLED";
    ItemStatus["NOT_BILLED"] = "NOT_BILLED";
    ItemStatus["PARTIALLY_BILLED"] = "PARTIALLY_BILLED";
    ItemStatus["PRODUCT_CHANGED"] = "PRODUCT_CHANGED";
    ItemStatus["SUPPLIER_ITEM_DAMAGED"] = "SUPPLIER_ITEM_DAMAGED";
    ItemStatus["SUPPLIER_ITEM_MISSING"] = "SUPPLIER_ITEM_MISSING";
})(ItemStatus || (exports.ItemStatus = ItemStatus = {}));
let OrderSlipsService = OrderSlipsService_1 = class OrderSlipsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(OrderSlipsService_1.name);
    }
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
    async findOne(id) {
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
    async generateSlips(userEmail) {
        const candidates = await this.prisma.repOrder.findMany({
            where: {
                poPendingItem: {
                    orderRequest: {
                        stage: client_1.OrderStage.REP_ALLOCATION
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
        const grouped = new Map();
        for (const item of candidates) {
            const supplierId = item.orderedSupplierId;
            if (!grouped.has(supplierId)) {
                grouped.set(supplierId, []);
            }
            grouped.get(supplierId).push(item);
        }
        let generatedCount = 0;
        await this.prisma.$transaction(async (tx) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const today = new Date();
            for (const [supplierId, items] of grouped) {
                let slip = await tx.orderSlip.findUnique({
                    where: {
                        supplierId_slipDate: {
                            supplierId,
                            slipDate: today
                        }
                    }
                });
                if (!slip) {
                    slip = await tx.orderSlip.create({
                        data: {
                            supplierId,
                            slipDate: today,
                            generatedBy: null
                        }
                    });
                }
                generatedCount++;
                for (const item of items) {
                    await tx.orderSlipItem.create({
                        data: {
                            orderSlipId: slip.id,
                            customerId: (_b = (_a = item.poPendingItem) === null || _a === void 0 ? void 0 : _a.orderRequest) === null || _b === void 0 ? void 0 : _b.customerId,
                            orderId: (_d = (_c = item.poPendingItem) === null || _c === void 0 ? void 0 : _c.orderRequest) === null || _d === void 0 ? void 0 : _d.orderId,
                            productId: item.productId,
                            itemNameSnapshot: (_f = (_e = item.poPendingItem) === null || _e === void 0 ? void 0 : _e.product) === null || _f === void 0 ? void 0 : _f.itemName,
                            qty: item.reqQty,
                            remarks: item.notes,
                            currentStatus: 'PENDING'
                        }
                    });
                    if ((_g = item.poPendingItem) === null || _g === void 0 ? void 0 : _g.orderRequestId) {
                        await tx.orderRequest.update({
                            where: { id: item.poPendingItem.orderRequestId },
                            data: { stage: client_1.OrderStage.SLIP_GENERATED }
                        });
                    }
                }
            }
        });
        return { message: 'Slips generated', generated: generatedCount };
    }
};
exports.OrderSlipsService = OrderSlipsService;
exports.OrderSlipsService = OrderSlipsService = OrderSlipsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrderSlipsService);
//# sourceMappingURL=order-slips.service.js.map