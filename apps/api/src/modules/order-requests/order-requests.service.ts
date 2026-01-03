import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as xlsx from 'xlsx';
import * as crypto from 'crypto';
import { OrderStage } from '@prisma/client';

@Injectable()
export class OrderRequestsService {
    private readonly logger = new Logger(OrderRequestsService.name);

    constructor(private prisma: PrismaService) { }

    async importOrderFile(file: Express.Multer.File, userEmail: string) {
        this.logger.log(`Processing file import: ${file.originalname} by ${userEmail}`);

        // 1. Parse Excel
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

        // 2. Iterate and Process
        for (const row of data) {
            try {
                await this.processRow(row, userEmail);
                results.imported++;
            } catch (error) {
                if (error.code === 'P2002') { // Unique constraint
                    results.skipped++;
                } else {
                    results.errors.push({ row, error: error.message });
                }
            }
        }

        return results;
    }

    private async processRow(row: any, userEmail: string) {
        // Sanitize keys
        const cleanRow: any = {};
        Object.keys(row).forEach(key => {
            cleanRow[key.trim().toLowerCase().replace(/[\s\.]/g, '_')] = row[key];
        });

        const acceptDate = new Date();
        const customerId = String(cleanRow['customer_id'] || cleanRow['cust_code'] || cleanRow['cust']);
        const orderId = String(cleanRow['order_id'] || cleanRow['order_no']);

        // Strict Mode: Upsert Product to get ID
        const rawProductName = String(cleanRow['product_name'] || cleanRow['item_name']);
        const reqQty = parseInt(cleanRow['req_qty'] || cleanRow['qty'] || cleanRow['quantity'] || '0', 10);

        if (!customerId || !orderId || !rawProductName || !reqQty) {
            throw new Error('Missing mandatory fields (cust, order, product, qty)');
        }

        const hashString = `${orderId}-${rawProductName}-${acceptDate.toISOString().split('T')[0]}`;
        const hash = crypto.createHash('sha256').update(hashString).digest('hex');

        await this.prisma.$transaction(async (tx) => {
            // 1. Resolve Product Master
            let product = await tx.product.findFirst({
                where: { itemName: { equals: rawProductName, mode: 'insensitive' } }
            });

            if (!product) {
                product = await tx.product.create({
                    data: {
                        itemName: rawProductName,
                        productCode: cleanRow['item_code'] || cleanRow['product_id'] || null
                    }
                });
            }

            // 2. Resolve Supplier Master (if provided)
            let orderedSupplierId: string | null = null;
            const supplierName = cleanRow['supplier'] || cleanRow['primary_supplier'];
            if (supplierName) {
                let supplier = await tx.supplier.findUnique({ where: { supplierName } });
                if (!supplier) {
                    supplier = await tx.supplier.create({ data: { supplierName } });
                }
                orderedSupplierId = supplier.id;
            }

            // 3. Create Order Request
            const orderRequest = await tx.orderRequest.create({
                data: {
                    acceptDatetime: acceptDate,
                    customerId,
                    orderId,
                    productId: product.id,
                    productNameSnapshot: rawProductName,
                    reqQty,
                    hash,
                    stage: OrderStage.PENDING, // Directly to Pending
                    created_at: new Date(),
                    inputFileId: null, // TODO: Link to PpoInputFile if we created it
                    primarySupplier: supplierName,
                    // Store extra fields if needed in future or map to specific columns
                } as any
            });

            // 4. Create PoPendingItem (Strict 1:1 Traceability)
            await tx.poPendingItem.create({
                data: {
                    productId: product.id,
                    orderRequestId: orderRequest.id,
                    totalReqQty: reqQty,
                    orderedQty: reqQty,
                    stockQty: 0,
                    offerQty: 0,
                    decidedSupplierId: orderedSupplierId,
                    allocatorNotes: '',
                    creator: { connect: { email: userEmail } }
                } as any
            });
        });
    }
}
