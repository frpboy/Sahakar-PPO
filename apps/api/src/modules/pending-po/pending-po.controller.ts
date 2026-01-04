import { Controller, Get, Put, Post, Body, Param, Request } from '@nestjs/common';
import { PendingPoService } from './pending-po.service';

@Controller('pending-items')
export class PendingPoController {
    constructor(private readonly service: PendingPoService) { }

    @Get()
    async getAllPendingItems() {
        return await this.service.getAllPendingItems();
    }

    @Put(':id/allocate')
    async updateAllocation(
        @Param('id') id: string,
        @Body() data: {
            orderedQty: number;
            stockQty: number;
            offerQty: number;
            allocatorNotes?: string;
        },
        @Request() req: any
    ) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.updateAllocation(id, data, userEmail);
    }

    @Post(':id/move-to-rep')
    async moveToRep(
        @Param('id') id: string,
        @Body() data: { supplierName: string; rate: number },
        @Request() req: any
    ) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.moveToRep(id, data.supplierName, data.rate, userEmail);
    }
}
