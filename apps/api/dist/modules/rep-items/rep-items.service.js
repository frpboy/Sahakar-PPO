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
exports.RepItemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const database_1 = require("@sahakar/database");
let RepItemsService = class RepItemsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.repItem.findMany({
            where: {
                pendingItem: {
                    orderRequest: {
                        stage: database_1.OrderStage.REP_ALLOCATION
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
    async updateAllocation(id, data) {
        const repItem = await this.prisma.repItem.findUnique({
            where: { id },
            include: { pendingItem: true }
        });
        if (!repItem)
            throw new common_1.NotFoundException('Rep item not found');
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
};
exports.RepItemsService = RepItemsService;
exports.RepItemsService = RepItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RepItemsService);
//# sourceMappingURL=rep-items.service.js.map