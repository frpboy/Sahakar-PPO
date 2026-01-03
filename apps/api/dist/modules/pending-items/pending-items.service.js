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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingItemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const database_1 = require("@sahakar/database");
let PendingItemsService = class PendingItemsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.pendingItem.findMany({
            where: {
                orderRequest: {
                    stage: database_1.OrderStage.PENDING
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
    async update(id, data) {
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
    async moveToRep(id, userEmail) {
        const item = await this.prisma.pendingItem.findUnique({
            where: { id },
            include: { orderRequest: true }
        });
        if (!item)
            throw new common_1.NotFoundException('Pending item not found');
        return this.prisma.$transaction(async (tx) => {
            await tx.repItem.create({
                data: {
                    pendingItemId: item.id,
                    orderStatus: 'ALLOCATED',
                    movedBy: userEmail,
                    rep: item.orderRequest.rep,
                    mobile: item.orderRequest.mobile
                }
            });
            await tx.pendingItem.update({
                where: { id: item.id },
                data: { moveToRep: true }
            });
            await tx.orderRequest.update({
                where: { id: item.orderRequestId },
                data: { stage: database_1.OrderStage.REP_ALLOCATION }
            });
            return { success: true };
        });
    }
};
exports.PendingItemsService = PendingItemsService;
exports.PendingItemsService = PendingItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PendingItemsService);
//# sourceMappingURL=pending-items.service.js.map