import { PpoImportService } from '../apps/api/src/modules/ppo-import/ppo-import.service';
import * as xlsx from 'xlsx';

// Mock the Service (we only want to test parseAndProcessOrders logic that doesn't depend on DB for parsing)
// Since parseAndProcessOrders calls processOrders which uses DB, we'll override processOrders to just return the rows.
class MockPpoImportService extends PpoImportService {
    constructor() {
        super();
    }

    // Override to avoid DB calls
    async processOrders(rows: any[], userEmail: string): Promise<any> {
        console.log('✅ processOrders called with', rows.length, 'rows');
        // Return rows for inspection
        return { rows };
    }
}

async function runTest() {
    console.log('🧪 Starting Excel Ingestion Verification...');

    // 1. Create a mock Excel file based on user specifications
    const headers = [
        'Accept date', 'Accepted Time', 'Customer id', 'Customer Name', 'order_id',
        'Product Id', 'product_name', 'Packing', 'Subcategory',
        'Primary Sup', 'Secondary Sup', 'Rep', 'Mobile',
        'mrp', 'O.Qty', 'C.Qty', 'Req Qty', 'Modification', 'Stage'
    ];

    const data = [
        {
            'Accept date': '3-1-2026',
            'Accepted Time': '10:56',
            'Customer id': 1918,
            'Customer Name': 'THURAYUR SAHAKAR MEDICALS AND SURGICALS (1918)',
            'order_id': 59213,
            'Product Id': 29545,
            'product_name': 'DIBETA 1GM SR TAB',
            'Packing': 10,
            'Subcategory': 'BRAND-RX',
            'Primary Sup': 'SUNANDA ASSOCIATES',
            'Secondary Sup': '',
            'Rep': '',
            'Mobile': '',
            'mrp': 42.5,
            'O.Qty': 5,
            'C.Qty': 0,
            'Req Qty': 5,
            'Modification': 'No Change',
            'Stage': 'Pending'
        },
        {
            'Accept date': '3-1-2026',
            'Accepted Time': '10:56',
            'Customer id': 1918,
            'Customer Name': 'THURAYUR SAHAKAR MEDICALS AND SURGICALS (1918)',
            'order_id': 59213,
            'Product Id': 16750,
            'product_name': 'DEXORANGE CAP',
            'Packing': 1,
            'Subcategory': 'BRAND-RX',
            'Primary Sup': 'SUNANDA ASSOCIATES',
            'Secondary Sup': '',
            'Rep': '',
            'Mobile': '',
            'mrp': 175.45,
            'O.Qty': 1,
            'C.Qty': 0,
            'Req Qty': 1,
            'Modification': 'No Change',
            'Stage': 'Pending'
        }
    ];

    const ws = xlsx.utils.json_to_sheet(data, { header: headers });
    // xlsx.utils.json_to_sheet does not strictly enforce "Accept date" format if passed as string in json,
    // but let's assume it mimics the file buffer correctly.
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 2. Instantiate Service
    const service = new MockPpoImportService();

    // 3. Run Parsing
    try {
        const result: any = await service.parseAndProcessOrders(buffer, 'test@test.com');
        const rows = result.rows;

        // 4. Verification assertions
        const row1 = rows[0];

        if (row1.legacyProductId === '29545') {
            console.log('✅ Legacy Product ID mapped correctly: 29545');
        } else {
            console.error('❌ Legacy Product ID mapping failed. Got:', row1.legacyProductId);
        }

        if (row1.customerName === 'THURAYUR SAHAKAR MEDICALS AND SURGICALS (1918)') {
            console.log('✅ Customer Name mapped correctly');
        } else {
            console.error('❌ Customer Name mapping failed');
        }

        if (row1.reqQty === 5) {
            console.log('✅ Req Qty mapped correctly');
        } else {
            console.error('❌ Req Qty mapping failed');
        }

        // Date Check
        if (row1.acceptDatetime instanceof Date && row1.acceptDatetime.getDate() === 3) {
            console.log('✅ Accept Date parsing logic works (Day is 3)');
        } else {
            console.error('❌ Date parsing issue:', row1.acceptDatetime);
        }

        console.log('🎉 Verification Complete!');

    } catch (e) {
        console.error('❌ Test Failed with error:', e);
    }
}

runTest();
