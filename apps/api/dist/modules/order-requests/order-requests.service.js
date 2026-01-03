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
var OrderRequestsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const xlsx = require("xlsx");
const crypto = require("crypto");
const database_1 = require("@sahakar/database");
let OrderRequestsService = OrderRequestsService_1 = class OrderRequestsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(OrderRequestsService_1.name);
    }
    async importOrderFile(file, userEmail) {
        this.logger.log(`Processing file import: ${file.originalname} by ${userEmail}`);
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        const results = {
            total: data.length,
            imported: 0,
            skipped: 0,
            errors: [],
        };
        for (const row of data) {
            try {
                await this.processRow(row, userEmail);
                results.imported++;
            }
            catch (error) {
                if (error.code === 'P2002') {
                    results.skipped++;
                }
                else {
                    results.errors.push({ row, error: error.message });
                }
            }
        }
        return results;
    }
    async processRow(row, userEmail) {
        const cleanRow = {};
        Object.keys(row).forEach(key => {
            cleanRow[key.trim().toLowerCase().replace(/[\s\.]/g, '_')] = row[key];
        });
        const acceptDate = new Date();
        const customerId = String(cleanRow['customer_id'] || cleanRow['cust_code'] || cleanRow['cust']);
        const orderId = String(cleanRow['order_id'] || cleanRow['order_no']);
        const productId = String(cleanRow['product_id'] || cleanRow['item_code']);
        const productName = String(cleanRow['product_name'] || cleanRow['item_name']);
        const reqQty = parseInt(cleanRow['req_qty'] || cleanRow['qty'] || cleanRow['quantity'] || '0', 10);
        if (!customerId || !orderId || !productId || !reqQty) {
            throw new Error('Missing mandatory fields');
        }
        const hashString = `${orderId}-${productId}-${acceptDate.toISOString().split('T')[0]}`;
        const hash = crypto.createHash('sha256').update(hashString).digest('hex');
        await this.prisma.$transaction(async (tx) => {
            const orderRequest = await tx.orderRequest.create({
                data: {
                    acceptDatetime: acceptDate,
                    customerId,
                    orderId,
                    productId,
                    productName,
                    reqQty,
                    hash,
                    createdBy: userEmail,
                    stage: database_1.OrderStage.RAW_INGESTED,
                    packing: cleanRow['packing'],
                    subcategory: cleanRow['subcategory'],
                    primarySupplier: cleanRow['supplier'] || cleanRow['primary_supplier'],
                    rep: cleanRow['rep'],
                    mobile: String(cleanRow['mobile'] || ''),
                    mrp: cleanRow['mrp'] ? parseFloat(cleanRow['mrp']) : null,
                }
            });
            await tx.pendingItem.create({
                data: {
                    orderRequestId: orderRequest.id,
                    orderedQty: reqQty,
                    stockQty: 0,
                    offerQty: 0,
                    orderedSupplier: cleanRow['supplier'] || cleanRow['primary_supplier'],
                    notes: '',
                }
            });
            await tx.orderRequest.update({
                where: { id: orderRequest.id },
                data: { stage: database_1.OrderStage.PENDING }
            });
        });
    }
};
exports.OrderRequestsService = OrderRequestsService;
exports.OrderRequestsService = OrderRequestsService = OrderRequestsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrderRequestsService);
//# sourceMappingURL=order-requests.service.js.map