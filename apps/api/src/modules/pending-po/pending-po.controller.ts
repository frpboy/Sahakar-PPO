import { Controller, Put, Post, Body, Param, Request } from '@nestjs/common';
import { PendingPoService } from './pending-po.service';

@Controller('pending-po')
export class PendingPoController {
    constructor(private readonly service: PendingPoService) { }

    @Put(':id/allocate')
    async updateAllocation(
        @Param('id') id: string,
        @Body() data: {
            orderedQty: number;
            stockQty: number;
            offerQty: number;
            decidedSupplierId: string;
            allocatorNotes?: string;
            done: boolean;
        },
        @Request() req: any
    ) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.updateAllocation(id, data, userEmail);
    }

    @Post(':id/move-to-rep')
    async moveToRep(@Param('id') id: string, @Request() req: any) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.moveToRep(id, userEmail);
    }

    @Post('rep/:id/return')
    async returnFromRep(@Param('id') id: string, @Request() req: any) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.returnFromRep(id, userEmail);
    }
}
