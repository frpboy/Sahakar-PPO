import { Injectable } from '@nestjs/common';
import { db } from '@sahakar/database';
import { ppoInput, pendingPoLedger, auditEvents, products } from '@sahakar/database';
import { eq, and, sql } from 'drizzle-orm';
import * as crypto from 'crypto';

interface OrderRow {
    acceptDatetime: Date;
    customerId?: bigint;
    orderId?: bigint;
    productId?: bigint;
    legacyProductId?: string;
    productName?: string;
    packing?: number;
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

export interface IngestionError {
    row: number;
    column: string;
    value: string;
    error: string;
}

export interface IngestionPreview {
    row: number;
    orderId: string;
    productId: string;
    productName: string;
    reqQty: number;
    stage: string;
    decision: 'CREATED' | 'UPDATED' | 'DUPLICATE' | 'REJECTED';
    reason: string;
}

export interface ProcessOrdersResult {
    fileName: string;
    summary: {
        rowsRead: number;
        rowsAccepted: number;
        pendingCreated: number;
        pendingUpdated: number;
        duplicatesSkipped: number;
    };
    preview: IngestionPreview[];
    errors: IngestionError[];
}

@Injectable()
export class PpoImportService {

    /**
     * Parse Excel file and process orders
     */
    async parseAndProcessOrders(
        fileBuffer: Buffer,
        userEmail: string,
        fileName: string = 'unknown.xlsx'
    ): Promise<ProcessOrdersResult> {
        console.log('parseAndProcessOrders started for:', fileName);

        // Debug DB Connection availability
        console.log('Checking Environment:', {
            hasDbUrl: !!process.env.DATABASE_URL,
            nodeEnv: process.env.NODE_ENV
        });

        let rawRows: any[] = [];
        try {
            const XLSX = require('@e965/xlsx');
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
            if (rawRows.length === 0) throw new Error('Excel file is empty');
        } catch (e) {
            console.error('Excel Parsing Error:', e);
            throw new Error(`Failed to parse Excel file: ${e.message} `);
        }

        const normalizeKey = (key: string): string => key.toString().trim().toLowerCase().replace(/[\s\.]/g, '_');
        const normalizedRows = rawRows.map(row => {
            const n: any = {};
            Object.keys(row).forEach(k => n[normalizeKey(k)] = row[k]);
            return n;
        });

        const rows: OrderRow[] = normalizedRows.map((row: any) => ({
            acceptDatetime: new Date(),
            customerId: row['customer_id'] ? BigInt(row['customer_id']) : undefined,
            customerName: row['customer_name'] || row['customername'],
            orderId: row['order_id'] ? BigInt(row['order_id']) : undefined,
            legacyProductId: row['product_id'] || row['productid'] || row['item_id'] || row['itemid'] || row['prod_id'],
            productName: row['product_name'] || row['productname'] || row['item_name'],
            packing: row['packing'] ? parseInt(row['packing'], 10) : undefined,
            category: row['category'],
            subcategory: row['subcategory'] || row['sub_category'],
            primarySupplier: row['primary_sup'] || row['primarysup'] || row['supplier_1'] || row['supplier1'] || row['primary_supplier'],
            secondarySupplier: row['secondary_sup'] || row['secondarysup'] || row['supplier_2'] || row['supplier2'] || row['secondary_supplier'],
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

        const firstRowDate = rawRows[0]?.['Accept date'] || rawRows[0]?.['Accept Date'] || rawRows[0]?.['accept_date'];
        let importDate = new Date();
        if (firstRowDate) {
            if (firstRowDate instanceof Date) importDate = firstRowDate;
            else if (!isNaN(firstRowDate) && typeof firstRowDate === 'number') {
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
        rows.forEach(r => r.acceptDatetime = importDate);

        return this.processOrders(rows, userEmail, fileName);
    }

    async processOrders(rows: OrderRow[], userEmail: string, fileName: string = 'manual_input.json'): Promise<ProcessOrdersResult> {
        const errors: IngestionError[] = [];
        const preview: IngestionPreview[] = [];
        let duplicatesSkipped = 0;
        let rowsAccepted = 0;
        let pendingCreated = 0;
        let pendingUpdated = 0;

        console.log('Fetching products from DB...');
        const productList = await db.select().from(products);
        console.log(`Fetched ${productList.length} products`);

        const productMap = new Map<string, bigint>(); // Maps legacyId (string) to productId (bigint)
        const productNameMap = new Map<string, bigint>(); // Maps productName (string) to productId (bigint)
        productList.forEach(p => {
            productMap.set(p.id.toString(), p.id); // Assuming p.id is the primary key and can be used as a legacyId if needed
            if (p.legacyId) productMap.set(p.legacyId, p.id);
            if (p.name) productNameMap.set(p.name.toLowerCase(), p.id);
        });

        // Step 1: Process Rows
        await db.transaction(async (tx) => {
            let rowIndex = 2; // Starting from 2 assuming header is 1
            for (const r of rows) {
                try {
                    if (r.reqQty <= 0) {
                        rowIndex++;
                        continue;
                    }

                    let pid = r.productId;
                    if (!pid) {
                        if (r.legacyProductId && productMap.has(r.legacyProductId)) {
                            pid = productMap.get(r.legacyProductId);
                        } else if (r.productName && productNameMap.has(r.productName.toLowerCase())) {
                            pid = productNameMap.get(r.productName.toLowerCase());
                        }
                    }

                    if (!pid) {
                        errors.push({
                            row: rowIndex,
                            column: 'Product ID',
                            value: r.legacyProductId || r.productName || 'N/A',
                            error: 'Product could not be resolved in Master List'
                        });

                        preview.push({
                            row: rowIndex,
                            orderId: r.orderId?.toString() || 'N/A',
                            productId: 'N/A',
                            productName: r.productName || 'N/A',
                            reqQty: r.reqQty,
                            stage: 'N/A',
                            decision: 'REJECTED',
                            reason: 'Unmapped Product'
                        });
                        rowIndex++;
                        continue;
                    }

                    // Deduplicate
                    const existing = await tx.select().from(ppoInput).where(
                        and(
                            eq(ppoInput.orderId, r.orderId!),
                            eq(ppoInput.productId, pid)
                        )
                    ).limit(1);

                    if (existing.length > 0) {
                        duplicatesSkipped++;
                        preview.push({
                            row: rowIndex,
                            orderId: r.orderId?.toString() || 'N/A',
                            productId: pid.toString(),
                            productName: r.productName || 'N/A',
                            reqQty: r.reqQty,
                            stage: existing[0].stage || 'N/A',
                            decision: 'DUPLICATE',
                            reason: 'Order already exists'
                        });
                        rowIndex++;
                        continue;
                    }

                    // Insert
                    const [inserted] = await tx.insert(ppoInput).values({
                        acceptedDate: r.acceptDatetime.toISOString().split('T')[0],
                        acceptedTime: r.acceptedTime || null,
                        customerId: r.customerId,
                        customerName: r.customerName,
                        orderId: r.orderId,
                        productId: pid,
                        productName: r.productName,
                        packing: r.packing,
                        subcategory: r.subcategory,
                        primarySupplier: r.primarySupplier,
                        secondarySupplier: r.secondarySupplier,
                        rep: r.rep,
                        mobile: r.mobile,
                        mrp: r.mrp?.toString(),
                        orderQty: r.oQty,
                        confirmedQty: r.cQty,
                        requestedQty: r.reqQty,
                        modification: r.modification,
                        stage: 'Pending'
                    }).returning();

                    rowsAccepted++;

                    if (preview.length < 100) {
                        preview.push({
                            row: rowIndex,
                            orderId: r.orderId?.toString() || 'N/A',
                            productId: pid.toString(),
                            productName: r.productName || 'N/A',
                            reqQty: r.reqQty,
                            stage: 'Pending',
                            decision: 'CREATED',
                            reason: 'New order ingested'
                        });
                    }

                    await tx.insert(auditEvents).values({
                        actor: userEmail,
                        action: 'INGEST',
                        entityType: 'PPO_INPUT',
                        entityId: inserted.id,
                        payload: { ...r, row: rowIndex } as any
                    });

                } catch (e: any) {
                    errors.push({
                        row: rowIndex,
                        column: 'UNKNOWN',
                        value: 'N/A',
                        error: e.message
                    });
                }
                rowIndex++;
            }

            // Global aggregation for pending_po_ledger
            console.log('Aggregating pending_po_ledger...');
            // Delete all existing non-locked pending items (we'll recalculate from scratch)
            await tx.delete(pendingPoLedger).where(eq(pendingPoLedger.locked, false));

            // Aggregate from ppo_input where stage is 'Pending'
            const aggregated = await tx.execute(sql`
                SELECT 
                    product_id,
                    SUM(requested_qty) as total_qty,
                    STRING_AGG(
                        'Ord:' || order_id || ' Cust:' || COALESCE(customer_id::text, '0') || ' Qty:' || requested_qty,
                        ', ' ORDER BY order_id
                    ) as aggregated_remarks
                FROM ppo_input
                WHERE stage = 'Pending'
                GROUP BY product_id
            `);

            for (const item of aggregated.rows) {
                const totalQty = parseInt(item.total_qty as string, 10);
                const pid = BigInt(item.product_id as string);

                if (totalQty > 0) {
                    // Check if already exists in ledger but is NOT locked
                    const existingLedger = await tx.select().from(pendingPoLedger).where(
                        and(
                            eq(pendingPoLedger.productId, pid),
                            eq(pendingPoLedger.locked, false)
                        )
                    ).limit(1);

                    if (existingLedger.length > 0) {
                        await tx.update(pendingPoLedger).set({
                            reqQty: totalQty,
                            remarks: item.aggregated_remarks as string,
                            updatedAt: new Date()
                        }).where(eq(pendingPoLedger.id, existingLedger[0].id));
                        pendingUpdated++;
                    } else {
                        await tx.insert(pendingPoLedger).values({
                            productId: pid,
                            reqQty: totalQty,
                            allocationStatus: 'PENDING',
                            remarks: item.aggregated_remarks as string
                        });
                        pendingCreated++;
                    }
                }
            }
            console.log(`Aggregation complete: ${pendingCreated} created, ${pendingUpdated} updated.`);
        });

        return {
            fileName,
            summary: {
                rowsRead: rows.length,
                rowsAccepted,
                pendingCreated,
                pendingUpdated,
                duplicatesSkipped
            },
            preview,
            errors
        };
    }

    async getAllInputItems(params: {
        productName?: string;
        orderId?: string;
        customerId?: string;
        rep?: string[];
        stage?: string[];
        supplier?: string;
        dateFrom?: string;
        dateTo?: string;
        sortField?: string;
        sortDir?: 'asc' | 'desc';
    }) {
        const conditions = [];

        if (params.productName) {
            conditions.push(sql`LOWER(${ppoInput.productName}) LIKE ${'%' + params.productName.toLowerCase() + '%'}`);
        }
        if (params.orderId) {
            conditions.push(sql`${ppoInput.orderId}::text LIKE ${'%' + params.orderId + '%'}`);
        }
        if (params.customerId) {
            conditions.push(sql`${ppoInput.customerId}::text LIKE ${'%' + params.customerId + '%'}`);
        }
        if (params.rep && params.rep.length > 0) {
            conditions.push(sql`${ppoInput.rep} IN ${params.rep}`);
        }
        if (params.stage && params.stage.length > 0) {
            conditions.push(sql`${ppoInput.stage} IN ${params.stage}`);
        }
        if (params.supplier) {
            conditions.push(sql`(
                LOWER(${ppoInput.primarySupplier}) LIKE ${'%' + params.supplier.toLowerCase() + '%'} OR
                LOWER(${ppoInput.secondarySupplier}) LIKE ${'%' + params.supplier.toLowerCase() + '%'} OR
                LOWER(${ppoInput.decidedSupplier}) LIKE ${'%' + params.supplier.toLowerCase() + '%'}
            )`);
        }
        if (params.dateFrom) {
            conditions.push(sql`${ppoInput.acceptedDate} >= ${params.dateFrom}`);
        }
        if (params.dateTo) {
            conditions.push(sql`${ppoInput.acceptedDate} <= ${params.dateTo}`);
        }

        const query = db.select({
            id: ppoInput.id,
            acceptedDate: ppoInput.acceptedDate,
            acceptedTime: ppoInput.acceptedTime,
            orderId: ppoInput.orderId,
            productId: ppoInput.productId,
            productName: ppoInput.productName,
            packing: ppoInput.packing,
            subcategory: ppoInput.subcategory,
            primarySupplier: ppoInput.primarySupplier,
            secondarySupplier: ppoInput.secondarySupplier,
            rep: ppoInput.rep,
            mobile: ppoInput.mobile,
            mrp: ppoInput.mrp,
            orderQty: ppoInput.orderQty,
            confirmedQty: ppoInput.confirmedQty,
            requestedQty: ppoInput.requestedQty,
            offer: ppoInput.offer,
            stock: ppoInput.stock,
            rate: ppoInput.rate,
            value: ppoInput.value,
            status: ppoInput.status,
            notes: ppoInput.notes,
            decidedSupplier: ppoInput.decidedSupplier,
            modification: ppoInput.modification,
            stage: ppoInput.stage,
            createdAt: ppoInput.createdAt,
            legacyId: products.legacyId,
            productCode: products.productCode
        })
            .from(ppoInput)
            .leftJoin(products, eq(ppoInput.productId, products.id));

        if (conditions.length > 0) {
            query.where(and(...conditions as any));
        }

        const sortFieldMap: Record<string, any> = {
            productName: ppoInput.productName,
            requestedQty: ppoInput.requestedQty,
            acceptedDate: ppoInput.acceptedDate,
            createdAt: ppoInput.createdAt
        };

        const sortCol = sortFieldMap[params.sortField || 'createdAt'] || ppoInput.createdAt;
        const sortDir = params.sortDir === 'asc' ? sql`ASC` : sql`DESC`;

        query.orderBy(sql`${sortCol} ${sortDir}`);

        const result = await query;
        // Convert BigInts for serialiazation
        return result.map(r => ({
            ...r,
            id: r.id?.toString(),
            orderId: r.orderId?.toString(),
            productId: r.productId?.toString(),
            customerId: (r as any).customerId?.toString()
        }));
    }
}
