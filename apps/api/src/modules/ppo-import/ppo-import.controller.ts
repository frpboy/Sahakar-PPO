import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Request
} from '@nestjs/common';
import { PpoImportService, ProcessOrdersResult } from './ppo-import.service';

interface ProcessOrdersDto {
    rows: Array<{
        acceptDatetime: string;
        customerId?: string;
        orderId?: string;
        productId: string;
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
    }>;
}

@Controller('ppo/import')
export class PpoImportController {
    constructor(private readonly ppoImportService: PpoImportService) { }

    /**
     * POST /ppo/import/process
     * 
     * Endpoint to process PPO import rows
     * Requires: PROCUREMENT_HEAD or ADMIN role
     */
    @Post('process')
    @HttpCode(HttpStatus.OK)
    async processOrders(
        @Body() dto: ProcessOrdersDto,
        @Request() req: any
    ): Promise<{ success: boolean; message: string; data: ProcessOrdersResult }> {
        // Convert string dates to Date objects
        const rows = dto.rows.map(row => ({
            ...row,
            acceptDatetime: new Date(row.acceptDatetime)
        }));

        const userEmail = req.user?.email || 'system@sahakar.local';

        const result = await this.ppoImportService.processOrders(rows, userEmail);

        return {
            success: true,
            message: 'Orders processed successfully',
            data: result
        };
    }
}
