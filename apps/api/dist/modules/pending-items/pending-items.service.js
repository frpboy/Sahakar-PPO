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
const client_1 = require("@prisma/client");
let PendingItemsService = class PendingItemsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.poPendingItem.findMany({
            where: {
                orderRequest: {
                    stage: client_1.OrderStage.PENDING
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
    async update(id, data) {
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
    async moveToRep(id, userEmail) {
        const item = await this.prisma.poPendingItem.findUnique({
            where: { id },
            include: { orderRequest: true }
        });
        if (!item)
            throw new common_1.NotFoundException('Pending item not found');
        return this.prisma.$transaction(async (tx) => {
            await tx.repOrder.create({
                data: {
                    poPendingId: item.id,
                    productId: item.productId,
                    reqQty: item.orderedQty,
                    orderedSupplierId: item.decidedSupplierId,
                    notes: item.allocatorNotes,
                }
            });
            await tx.poPendingItem.update({
                where: { id: item.id },
                data: { movedToRep: true }
            });
            if (item.orderRequestId) {
                await tx.orderRequest.update({
                    where: { id: item.orderRequestId },
                    data: { stage: client_1.OrderStage.REP_ALLOCATION }
                });
            }
            await tx.auditEvent.create({
                data: {
                    entityType: 'PoPendingItem',
                    entityId: item.id,
                    action: 'MOVE_TO_REP',
                    beforeState: { moveToRep: false },
                    afterState: { moveToRep: true },
                    actor: { connect: { email: userEmail } }
                }
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