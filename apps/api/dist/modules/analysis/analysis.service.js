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
exports.AnalysisService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const client_1 = require("@prisma/client");
let AnalysisService = class AnalysisService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        const [total, raw, pending, rep_allocation, slip_generated, executed] = await Promise.all([
            this.prisma.orderRequest.count(),
            this.prisma.orderRequest.count({ where: { stage: client_1.OrderStage.RAW_INGESTED } }),
            this.prisma.orderRequest.count({ where: { stage: client_1.OrderStage.PENDING } }),
            this.prisma.orderRequest.count({ where: { stage: client_1.OrderStage.REP_ALLOCATION } }),
            this.prisma.orderRequest.count({ where: { stage: client_1.OrderStage.SLIP_GENERATED } }),
            this.prisma.orderRequest.count({ where: { stage: client_1.OrderStage.EXECUTED } })
        ]);
        return {
            total,
            raw,
            pending,
            rep_allocation,
            slip_generated,
            executed
        };
    }
    async getStatusLedger(limit = 20) {
        return this.prisma.statusEvent.findMany({
            take: limit,
            orderBy: { eventTime: 'desc' }
        });
    }
    async getGapAnalysis() {
        return this.prisma.orderSlipItem.findMany({
            where: {
                OR: [
                    { currentStatus: { not: 'BILLED' } },
                ]
            },
            include: {
                orderSlip: true
            },
            take: 50,
            orderBy: { createdAt: 'desc' }
        });
    }
};
exports.AnalysisService = AnalysisService;
exports.AnalysisService = AnalysisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalysisService);
//# sourceMappingURL=analysis.service.js.map