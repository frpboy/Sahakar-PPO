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

export interface ProcessOrdersResult {
    totalRows: number;
    validRows: number;
    duplicates: number;
    rejectedNoProduct: number;
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

        return this.processOrders(rows, userEmail);
    }

    async processOrders(rows: OrderRow[], userEmail: string): Promise<ProcessOrdersResult> {
        const batchId = crypto.randomUUID();
        const errors: string[] = [];
        const preview: any[] = [];
        let duplicates = 0;
        let rejectedNoProduct = 0;
        let processed = 0;

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

        // Step 1: Resolve productId and Filter rows
        const validRows: OrderRow[] = [];
        for (const row of rows) {
            if (row.reqQty <= 0) { // Only process rows with positive quantity
                continue;
            }

            let pid = row.productId;
            if (!pid) {
                if (row.legacyProductId && productMap.has(row.legacyProductId)) {
                    pid = productMap.get(row.legacyProductId);
                } else if (row.productName && productNameMap.has(row.productName.toLowerCase())) {
                    pid = productNameMap.get(row.productName.toLowerCase());
                }
            }

            if (!pid) {
                rejectedNoProduct++;
                errors.push(`Row for product '${row.productName || row.legacyProductId}' rejected: Product ID could not be resolved.`);
                continue;
            }
            row.productId = pid;
            validRows.push(row);
        }

        console.log(`Valid rows after product resolution: ${validRows.length}, Rejected(no product): ${rejectedNoProduct} `);

        await db.transaction(async (tx) => {
            for (const r of validRows) {
                try {
                    // Deduplicate by (order_id + product_id)
                    // Ensure orderId is present for deduplication
                    if (!r.orderId || !r.productId) {
                        errors.push(`Row skipped: Missing orderId or productId for deduplication.Order: ${r.orderId}, Product: ${r.productId} `);
                        continue;
                    }

                    const existing = await tx.select().from(ppoInput).where(
                        and(
                            eq(ppoInput.orderId, r.orderId),
                            eq(ppoInput.productId, r.productId)
                        )
                    ).limit(1);

                    if (existing.length > 0) {
                        duplicates++;
                        continue; // Skip insertion if duplicate
                    }

                    const [inserted] = await tx.insert(ppoInput).values({
                        acceptedDate: r.acceptDatetime.toISOString().split('T')[0],
                        acceptedTime: r.acceptedTime || null,
                        customerId: r.customerId,
                        customerName: r.customerName,
                        orderId: r.orderId,
                        productId: r.productId,
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
                        stage: 'Pending' // Default stage for new inputs
                    }).returning();

                    processed++;

                    if (preview.length < 100) {
                        preview.push({
                            orderId: r.orderId?.toString(),
                            productName: r.productName,
                            qty: r.reqQty,
                            status: 'Inserted'
                        });
                    }

                    await tx.insert(auditEvents).values({
                        actor: userEmail,
                        action: 'INGEST',
                        entityType: 'PPO_INPUT',
                        entityId: inserted.id,
                        payload: r as any // Cast to any as OrderRow might not perfectly match payload type
                    });
                } catch (e: any) {
                    console.error(`Error processing row for order ${r.orderId} product ${r.productId}: `, e);
                    errors.push(`Row Error(Order: ${r.orderId}, Product: ${r.productName}): ${e.message} `);
                }
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
                if (totalQty > 0) {
                    await tx.insert(pendingPoLedger).values({
                        productId: BigInt(item.product_id as string),
                        reqQty: totalQty,
                        allocationStatus: 'PENDING',
                        remarks: item.aggregated_remarks as string
                    });
                }
            }
            console.log(`Created ${aggregated.rows.length} aggregated pending items in pending_po_ledger.`);
        });

        return {
            totalRows: rows.length,
            validRows: validRows.length,
            duplicates,
            rejectedNoProduct,
            processed,
            batchId,
            errors,
            preview
        };
    }

    async getAllInputItems() {
        return await db.select({
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
            createdAt: ppoInput.createdAt
        })
            .from(ppoInput)
            .orderBy(sql`${ppoInput.createdAt} DESC`);
    }
}
