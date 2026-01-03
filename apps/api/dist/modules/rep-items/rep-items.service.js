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
const client_1 = require("@prisma/client");
let RepItemsService = class RepItemsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.repOrder.findMany({
            where: {
                poPendingItem: {
                    orderRequest: {
                        stage: client_1.OrderStage.REP_ALLOCATION
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
    async updateAllocation(id, data) {
        const { repId, notes } = data;
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.repOrder.update({
                where: { id },
                data: {
                    repId: repId,
                    notes: notes
                }
            });
            await tx.auditEvent.create({
                data: {
                    entityType: 'RepOrder',
                    entityId: id,
                    action: 'ASSIGN_REP',
                    afterState: data,
                }
            });
            return updated;
        });
    }
};
exports.RepItemsService = RepItemsService;
exports.RepItemsService = RepItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RepItemsService);
//# sourceMappingURL=rep-items.service.js.map