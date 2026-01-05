import { Controller, Get, Patch, Post, Body, Param, Query, Request } from '@nestjs/common';
import { RepAllocationService } from './rep-allocation.service';

@Controller('rep-items')
export class RepAllocationController {
    constructor(private readonly service: RepAllocationService) { }

    @Get()
    async getAll(@Query() query: any) {
        return await this.service.getAllRepItems(query);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() payload: any,
        @Request() req: any
    ) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.updateRepItem(id, payload, userEmail);
    }

    @Post(':id/return')
    async returnToPending(
        @Param('id') id: string,
        @Request() req: any
    ) {
        const userEmail = req.user?.email || req.body?.userEmail || 'system@sahakar.local';
        return await this.service.returnToPending(id, userEmail);
    }
}
