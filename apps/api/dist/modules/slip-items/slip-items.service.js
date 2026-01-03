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
const database_1 = require("@sahakar/database");
let SlipItemsService = class SlipItemsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateStatus(id, data, userEmail) {
        const { status, receivedQty, qtyDamaged, qtyPending, invoiceId, notes } = data;
        const item = await this.prisma.orderSlipItem.findUnique({
            where: { id },
            include: { orderSlip: true }
        });
        if (!item)
            throw new common_1.NotFoundException('Slip item not found');
        if (status === database_1.ItemStatus.BILLED && (!receivedQty || receivedQty <= 0)) {
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedItem = await tx.orderSlipItem.update({
                where: { id },
                data: {
                    status: status,
                    qtyReceived: receivedQty ? Number(receivedQty) : undefined,
                    qtyDamaged: qtyDamaged ? Number(qtyDamaged) : undefined,
                    qtyPending: qtyPending ? Number(qtyPending) : undefined,
                    invoiceId: invoiceId,
                    notes: notes,
                    updatedBy: userEmail
                }
            });
            await tx.statusEvent.create({
                data: {
                    supplier: item.orderSlip.supplier,
                    customerId: item.customerId,
                    orderId: item.orderId,
                    itemOld: item.itemName,
                    itemNew: item.itemName,
                    qty: item.qty,
                    status: status,
                    receivedQty: receivedQty ? Number(receivedQty) : 0,
                    badQty: qtyDamaged ? Number(qtyDamaged) : 0,
                    pendingQty: qtyPending ? Number(qtyPending) : 0,
                    invoiceId: invoiceId,
                    notes: notes,
                    staff: userEmail
                }
            });
            await tx.orderRequest.updateMany({
                where: { orderId: item.orderId, customerId: item.customerId },
                data: { stage: database_1.OrderStage.EXECUTED }
            });
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