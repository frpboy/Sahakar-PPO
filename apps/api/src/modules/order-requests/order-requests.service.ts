import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as xlsx from 'xlsx';
import * as crypto from 'crypto';
import { OrderStage } from '@sahakar/database';

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

        // 3. Log Audit Event (TODO)

        return results;
    }

    private async processRow(row: any, userEmail: string) {
        // Map columns (adjusting based on typical PPO format or heuristics)
        // Assuming keys match requirements or basic sanitization needed

        // Required fields based on schema:
        // customerId, orderId, productId, productName, reqQty

        // Sanitize keys (simple normalization)
        const cleanRow: any = {};
        Object.keys(row).forEach(key => {
            cleanRow[key.trim().toLowerCase().replace(/[\s\.]/g, '_')] = row[key];
        });

        // Mapping logic - needs specific column names from 'follow this...' doc if available, else standard infer
        // "Accept Date", "Cust", "Order", "Product", "Qty"
        const acceptDate = new Date(); // Or parse from row if provided
        const customerId = String(cleanRow['customer_id'] || cleanRow['cust_code'] || cleanRow['cust']);
        const orderId = String(cleanRow['order_id'] || cleanRow['order_no']);
        const productId = String(cleanRow['product_id'] || cleanRow['item_code']);
        const productName = String(cleanRow['product_name'] || cleanRow['item_name']);
        const reqQty = parseInt(cleanRow['req_qty'] || cleanRow['qty'] || cleanRow['quantity'] || '0', 10);

        if (!customerId || !orderId || !productId || !reqQty) {
            throw new Error('Missing mandatory fields');
        }

        // Hash Generation: Order + Product + Date (as per doc)
        // "Each line is hashed (Order + Product + Date)"
        // Date typically means the import date or accept date? Doc says "Accept date & time" is ingested.
        // If Accept Date is in file, use it. If not, maybe use today. 
        // "Duplicate hashes are rejected"

        const hashString = `${orderId}-${productId}-${acceptDate.toISOString().split('T')[0]}`;
        // Note: Doc says "Order + Product + Date". 
        // If multiple imports happen same day for same order/product, it should block? Yes.

        const hash = crypto.createHash('sha256').update(hashString).digest('hex');

        // Create OrderRequest
        // Using transaction to ensure atomicity if we were doing more, but single record is atomic enough
        // Create OrderRequest & PendingItem in transaction
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
                    stage: OrderStage.RAW_INGESTED, // Initially raw

                    // Optional fields
                    packing: cleanRow['packing'],
                    subcategory: cleanRow['subcategory'],
                    primarySupplier: cleanRow['supplier'] || cleanRow['primary_supplier'],
                    rep: cleanRow['rep'],
                    mobile: String(cleanRow['mobile'] || ''),
                    mrp: cleanRow['mrp'] ? parseFloat(cleanRow['mrp']) : null,
                }
            });

            // Automatically promote to PendingItem (Stage 2)
            await tx.pendingItem.create({
                data: {
                    orderRequestId: orderRequest.id,
                    orderedQty: reqQty, // Default to requested
                    stockQty: 0,
                    offerQty: 0,
                    orderedSupplier: cleanRow['supplier'] || cleanRow['primary_supplier'],
                    notes: '',
                }
            });

            // Update stage to PENDING to reflect it's ready for review
            await tx.orderRequest.update({
                where: { id: orderRequest.id },
                data: { stage: OrderStage.PENDING }
            });
        });
    }
}
