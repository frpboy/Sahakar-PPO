import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { OrderSlipsService } from './order-slips.service';

@Controller('order-slips')
export class OrderSlipsController {
    constructor(private readonly service: OrderSlipsService) { }

    @Get()
    async listSlips() {
        return await this.service.listSlips();
    }

    @Post('generate')
    async generateSlips(
        @Body() data: {
            supplierNames: string[];
            slipDate: string;
        },
        @Request() req: any
    ) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.generateSlips(
            data.supplierNames,
            data.slipDate,
            userEmail
        );
    }

    @Get(':id')
    async getSlipDetails(@Param('id') id: string) {
        return await this.service.getSlipDetails(id);
    }
}
