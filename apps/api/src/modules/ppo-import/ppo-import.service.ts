import { Injectable } from '@nestjs/common';
import { db } from '@sahakar/database';
import { orderRequests, pendingItems, auditEvents, products, suppliers } from '@sahakar/database';
import { eq, sql } from 'drizzle-orm';
import * as crypto from 'crypto';

interface OrderRow {
    acceptDatetime: Date;
    customerId?: string;
    orderId?: string;
    productId?: string;
    legacyProductId?: string;
    productName?: string;
    packing?: string;
    category?: string;
    subcategory?: string;
    primarySupplier?: string;
    secondarySupplier?: string;
    rep?: string;
    mobile?: string;
    mrp?: number;
    reqQty: number;
    customerName?: string;
    acceptedTime?: string;
    oQty?: number;
    cQty?: number;
    modification?: string;
    stage?: string;
}

export interface ProcessOrdersResult {
    totalRows: number;
    validRows: number;
    duplicates: number;
    processed: number;
    batchId: string;
    errors: string[];
    preview: any[];
}

@Injectable()
export class PpoImportService {

    /**
     * Parse Excel file and process orders
     */
    async parseAndProcessOrders(
        fileBuffer: Buffer,
        userEmail: string
    ): Promise<ProcessOrdersResult> {
        console.log('parseAndProcessOrders started');

        // Debug DB Connection availability
        console.log('Checking Environment:', {
            hasDbUrl: !!process.env.DATABASE_URL,
            nodeEnv: process.env.NODE_ENV
        });

        let rawRows: any[] = [];
        let detectedHeaders: string[] = [];

        try {
            const XLSX = require('@e965/xlsx');
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Convert to JSON
            rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

            if (rawRows.length === 0) {
                throw new Error('Excel file is empty or has no data rows');
            }

            detectedHeaders = Object.keys(rawRows[0]);
            console.log('Detected Excel headers:', detectedHeaders);
        } catch (e) {
            console.error('Excel Parsing Error:', e);
            throw new Error(`Failed to parse Excel file: ${e.message}`);
        }

        // Step A: Normalize headers
        const normalizeKey = (key: string): string => {
            return key.toString().trim().toLowerCase().replace(/[\s\.]/g, '_');
        };

        const normalizedRows = rawRows.map(row => {
            const normalized: any = {};
            Object.keys(row).forEach(key => {
                normalized[normalizeKey(key)] = row[key];
            });
            return normalized;
        });

        // Map to OrderRow
        const rows: OrderRow[] = normalizedRows.map((row: any) => ({
            acceptDatetime: new Date(),
            customerId: row['customer_id'] || row['customerid'] || row['cust_id'],
            customerName: row['customer_name'] || row['customername'],
            orderId: row['order_id'] || row['orderid'],
            legacyProductId: row['product_id'] || row['productid'] || row['item_id'] || row['itemid'] || row['prod_id'],
            productId: undefined,
            productName: row['product_name'] || row['productname'] || row['item_name'],
            packing: row['packing'],
            category: row['category'],
            subcategory: row['subcategory'] || row['sub_category'],
            primarySupplier: row['primary_sup'] || row['primarysup'] || row['supplier_1'] || row['supplier1'],
            secondarySupplier: row['secondary_sup'] || row['secondarysup'] || row['supplier_2'] || row['supplier2'],
            rep: row['rep'] || row['rep_name'],
            mobile: row['mobile'] || row['phone'],
            mrp: parseFloat(row['mrp'] || '0'),
            reqQty: parseInt(row['req_qty'] || row['reqty'] || row['qty'] || row['quantity'] || '0', 10),
            acceptedTime: row['accepted_time'] || row['acceptedtime'],
            oQty: parseInt(row['o_qty'] || row['oqty'] || '0', 10),
            cQty: parseInt(row['c_qty'] || row['cqty'] || '0', 10),
            modification: row['modification'],
            stage: row['stage']
        }));

        // Date Parsing
        const firstRowDate = rawRows[0]?.['Accept date'] || rawRows[0]?.['Accept Date'] || rawRows[0]?.['accept_date'];
        let importDate = new Date();

        if (firstRowDate) {
            if (firstRowDate instanceof Date) {
                importDate = firstRowDate;
            } else if (!isNaN(firstRowDate) && typeof firstRowDate === 'number') {
                const excelEpoch = new Date(1900, 0, 1);
                importDate = new Date(excelEpoch.getTime() + (firstRowDate - 2) * 24 * 60 * 60 * 1000);
            } else if (typeof firstRowDate === 'string') {
                const parts = firstRowDate.toString().split(/[-\/]/);
                if (parts.length === 3) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);
                    importDate = new Date(year, month, day);
                }
            }
        }

        // Valid Rows: Require reqQty > 0 only.
        // We now allow rows without productId (they will be inserted into orderRequests but skipped for pendingItems)
        const validRows = rows.filter(r => r.reqQty > 0);

        if (validRows.length === 0) {
            throw new Error(`No valid rows found. Detected headers: ${detectedHeaders.join(', ')}`);
        }

        console.log(`Valid rows: ${validRows.length}`);
        validRows.forEach(r => r.acceptDatetime = importDate);

        return this.processOrders(validRows, userEmail);
    }

    async processOrders(rows: OrderRow[], userEmail: string): Promise<ProcessOrdersResult> {
        const batchId = crypto.randomUUID();
        const errors: string[] = [];
        const preview: any[] = [];
        let duplicates = 0;
        let processed = 0;

        try {
            // DB Lookup
            console.log('Fetching products from DB...');
            let productList = [];
            try {
                productList = await db.select().from(products);
                console.log(`Fetched ${productList.length} products`);
            } catch (e) {
                console.error('Failed to fetch products:', e);
                throw new Error(`Database connection failed: ${e.message}`);
            }

            const productMap = new Map();
            const productNameMap = new Map();

            productList.forEach(p => {
                if (p.legacyId) productMap.set(p.legacyId, p.id);
                if (p.itemName) productNameMap.set(p.itemName.toLowerCase(), p.id);
            });

            // Resolve productId for all rows
            for (const row of rows) {
                if (!row.productId) {
                    if (row.legacyProductId && productMap.has(row.legacyProductId)) {
                        row.productId = productMap.get(row.legacyProductId);
                    } else if (row.productName && productNameMap.has(row.productName.toLowerCase())) {
                        row.productId = productNameMap.get(row.productName.toLowerCase());
                    }
                }
            }

            // Group rows by order_id
            const orderGroups = new Map<string, OrderRow[]>();
            for (const row of rows) {
                const orderId = row.orderId || 'UNKNOWN';
                if (!orderGroups.has(orderId)) {
                    orderGroups.set(orderId, []);
                }
                orderGroups.get(orderId)!.push(row);
            }

            console.log(`Processing ${orderGroups.size} unique orders with ${rows.length} total items`);

            // Transaction
            await db.transaction(async (tx) => {
                for (const [orderId, orderRows] of orderGroups.entries()) {
                    try {
                        // Step 1: Check if order_id already exists
                        const existingOrders = await tx
                            .select()
                            .from(orderRequests)
                            .where(eq(orderRequests.orderId, orderId));

                        if (existingOrders.length > 0) {
                            console.log(`Order ${orderId} already exists. Updating...`);

                            // Delete existing order_requests with this orderId
                            await tx
                                .delete(orderRequests)
                                .where(eq(orderRequests.orderId, orderId));

                            duplicates++;
                        }

                        // Step 2: Insert all items for this order
                        for (const r of orderRows) {
                            const [inserted] = await tx.insert(orderRequests).values({
                                acceptDatetime: r.acceptDatetime,
                                orderId: r.orderId,
                                customerId: r.customerId,
                                productId: r.productId || null,
                                reqQty: r.reqQty,
                                customerName: r.customerName,
                                legacyProductId: r.legacyProductId,
                                productName: r.productName,
                                packing: r.packing,
                                category: r.category,
                                subcategory: r.subcategory,
                                primarySupplier: r.primarySupplier,
                                secondarySupplier: r.secondarySupplier,
                                rep: r.rep,
                                mobile: r.mobile,
                                mrp: r.mrp?.toString(),
                                acceptedTime: r.acceptedTime,
                                oQty: r.oQty,
                                cQty: r.cQty,
                                modification: r.modification,
                                stage: r.productId ? 'PENDING' : 'UNMATCHED',
                                hash: this.generateRowHash(r)
                            }).returning();

                            if (inserted) {
                                processed++;

                                await tx.insert(auditEvents).values({
                                    entityType: 'ORDER',
                                    entityId: inserted.id,
                                    action: existingOrders.length > 0 ? 'UPDATE' : 'INGEST',
                                    actor: userEmail,
                                    afterState: JSON.stringify(r)
                                });
                            }

                            // Collect preview data (limit to first 100)
                            if (preview.length < 100) {
                                preview.push({
                                    row: preview.length + 1,
                                    orderId: r.orderId,
                                    customerName: r.customerName,
                                    productName: r.productName,
                                    qty: r.reqQty,
                                    supplierName: r.primarySupplier || '-',
                                    status: existingOrders.length > 0 ? 'Updated' : 'Inserted'
                                });
                            }
                        }

                    } catch (orderError) {
                        console.error(`Error processing order ${orderId}:`, orderError);
                        errors.push(`Order ${orderId}: ${orderError.message}`);
                    }
                }

                // Step 3: Aggregate pending_items by product_id across ALL orders
                console.log('Aggregating pending_items by product_id...');

                // Delete all existing pending items (we'll recalculate from scratch)
                await tx.delete(pendingItems);

                // Aggregate from order_requests where productId is not null
                // IMPORTANT: Only include orders with stage = 'PENDING'
                // Orders with stage = 'COMPLETED' or 'Pending' (completed in ERP) are excluded
                const aggregatedItems = await tx.execute(sql`
                    SELECT 
                        product_id,
                        SUM(req_qty) as total_qty
                    FROM order_requests
                    WHERE product_id IS NOT NULL 
                    AND (
                        stage = 'PENDING' 
                        OR stage = 'UNMATCHED'
                    )
                    AND LOWER(stage) NOT LIKE '%complet%'
                    AND LOWER(stage) NOT LIKE '%done%'
                    AND LOWER(stage) NOT LIKE '%executed%'
                    GROUP BY product_id
                `);

                // Insert aggregated pending_items with state = 'PENDING'
                for (const item of aggregatedItems.rows) {
                    const totalQty = parseInt(item.total_qty as string, 10);
                    if (totalQty > 0) {
                        await tx.insert(pendingItems).values({
                            productId: item.product_id as string,
                            reqQty: totalQty,
                            state: 'PENDING'
                        });
                    }
                }

                console.log(`Created ${aggregatedItems.rows.length} aggregated pending items (excluding completed orders)`);
            });

        } catch (dbError) {
            console.error('Database Error in processOrders:', dbError);
            throw new Error(`Database operation failed: ${dbError.message}`);
        }

        return {
            totalRows: rows.length,
            validRows: rows.length,
            duplicates,
            processed,
            batchId,
            errors,
            preview
        };
    }

    private generateRowHash(row: OrderRow): string {
        const hashInput = `${row.acceptDatetime.toISOString()}|${row.orderId}|${row.productId}|${row.reqQty}`;
        return crypto.createHash('sha256').update(hashInput).digest('hex');
    }
}
