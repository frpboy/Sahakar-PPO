import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { PpoImportService, ProcessOrdersResult } from './ppo-import.service';

interface ProcessOrdersDto {
    rows: Array<{
        acceptDatetime: string;
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
    /**
     * POST /ppo/import/upload
     * 
     * Upload an Excel file for processing
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(HttpStatus.OK)
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any
    ): Promise<{ success: boolean; message: string; data: ProcessOrdersResult }> {
        console.log('Upload endpoint hit');
        console.log('File object:', file ? {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            bufferLength: file.buffer?.length
        } : 'null');

        if (!file) {
            throw new Error('No file uploaded');
        }

        if (!file.buffer || file.buffer.length === 0) {
            throw new Error('File buffer is empty');
        }

        const userEmail = req.user?.email || req.body?.userEmail || 'system@sahakar.local';
        console.log('Processing file for user:', userEmail);

        const result = await this.ppoImportService.parseAndProcessOrders(file.buffer, userEmail);

        return {
            success: true,
            message: 'File processed successfully',
            data: result
        };
    }
}
