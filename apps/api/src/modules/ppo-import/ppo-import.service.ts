import { Injectable } from '@nestjs/common';
import { db } from '@sahakar/database';
import { orderRequests, pendingItems, auditEvents, products, suppliers } from '@sahakar/database';
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

        const validRows = rows.filter(r => (r.productId || r.legacyProductId) && r.reqQty > 0);

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
        let duplicates = 0;
        let processed = 0;

        try {
            // DB Lookup
            console.log('Fetching products from DB...');
            // Need to handle potential DB connection errors gracefully
            let productList;
            try {
                productList = await db.select().from(products);
                console.log(`Fetched ${productList.length} products`);
            } catch (e) {
                console.error('Failed to fetch products:', e);
                // Fallback or abort? Abort for now
                throw new Error(`Database connection failed: ${e.message}`);
            }

            const productMap = new Map();
            const productNameMap = new Map();

            productList.forEach(p => {
                if (p.legacyId) productMap.set(p.legacyId, p.id);
                if (p.itemName) productNameMap.set(p.itemName.toLowerCase(), p.id);
            });

            const dedupedRows: OrderRow[] = [];

            for (const row of rows) {
                if (!row.productId) {
                    if (row.legacyProductId && productMap.has(row.legacyProductId)) {
                        row.productId = productMap.get(row.legacyProductId);
                    } else if (row.productName && productNameMap.has(row.productName.toLowerCase())) {
                        row.productId = productNameMap.get(row.productName.toLowerCase());
                    }
                }

                if (row.productId) {
                    dedupedRows.push(row);
                } else {
                    errors.push(`Order ${row.orderId}: Product not found (Legacy ID: ${row.legacyProductId})`);
                }
            }

            console.log(`Matched products for ${dedupedRows.length} rows`);

            // Transaction
            if (dedupedRows.length > 0) {
                await db.transaction(async (tx) => {
                    for (const r of dedupedRows) {
                        try {
                            const hash = this.generateRowHash(r);
                            const [inserted] = await tx.insert(orderRequests).values({
                                acceptDatetime: r.acceptDatetime,
                                orderId: r.orderId,
                                customerId: r.customerId,
                                productId: r.productId,
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
                                stage: 'PENDING',
                                hash: hash
                            }).onConflictDoNothing().returning();

                            if (inserted) {
                                processed++;
                                await tx.insert(pendingItems).values({
                                    productId: r.productId,
                                    reqQty: r.reqQty,
                                    state: 'PENDING'
                                });

                                await tx.insert(auditEvents).values({
                                    entityType: 'ORDER',
                                    entityId: inserted.id,
                                    action: 'INGEST',
                                    actor: userEmail,
                                    afterState: JSON.stringify(r)
                                });
                            } else {
                                duplicates++;
                            }

                        } catch (itemError) {
                            console.error('Row Insert Error:', itemError);
                            errors.push(`Row Error: ${itemError.message}`);
                        }
                    }
                });
            }

        } catch (dbError) {
            console.error('Database Error in processOrders:', dbError);
            throw new Error(`Database operation failed: ${dbError.message}`);
        }

        return {
            totalRows: rows.length,
            validRows: rows.length, // total valid rows passed to function
            duplicates,
            processed,
            batchId,
            errors
        };
    }

    private generateRowHash(row: OrderRow): string {
        const hashInput = `${row.acceptDatetime.toISOString()}|${row.orderId}|${row.productId}|${row.reqQty}`;
        return crypto.createHash('sha256').update(hashInput).digest('hex');
    }
}
