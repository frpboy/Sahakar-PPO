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
exports.SlipItemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const client_1 = require("@prisma/client");
let SlipItemsService = class SlipItemsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateStatus(id, data, userEmail) {
        const { status, receivedQty, damagedQty, pendingQty, invoiceId, notes } = data;
        const item = await this.prisma.orderSlipItem.findUnique({
            where: { id },
            include: { orderSlip: true }
        });
        if (!item)
            throw new common_1.NotFoundException('Slip item not found');
        return this.prisma.$transaction(async (tx) => {
            const updatedItem = await tx.orderSlipItem.update({
                where: { id },
                data: {
                    currentStatus: status
                }
            });
            await tx.statusEvent.create({
                data: {
                    orderSlipItemId: item.id,
                    status: status,
                    orderedQty: item.qty,
                    receivedQty: receivedQty ? Number(receivedQty) : 0,
                    damagedQty: damagedQty ? Number(damagedQty) : 0,
                    pendingQty: pendingQty ? Number(pendingQty) : 0,
                    invoiceId: invoiceId,
                    notes: notes,
                    performedBy: null
                }
            });
            if (status === 'BILLED' || status === 'EXECUTED') {
                await tx.orderRequest.updateMany({
                    where: { orderId: item.orderId, customerId: item.customerId },
                    data: { stage: client_1.OrderStage.EXECUTED }
                });
            }
            return updatedItem;
        });
    }
};
exports.SlipItemsService = SlipItemsService;
exports.SlipItemsService = SlipItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SlipItemsService);
//# sourceMappingURL=slip-items.service.js.map