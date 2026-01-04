import { Controller, Post, Body, Request } from '@nestjs/common';
import { OrderSlipsService } from './order-slips.service';

@Controller('order-slips')
export class OrderSlipsController {
    constructor(private readonly service: OrderSlipsService) { }

    @Post('generate')
    async generateSlips(
        @Body() data: {
            supplierIds: string[];
            slipDate: string;
            regenerate?: boolean;
        },
        @Request() req: any
    ) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.generateSlips(
            data.supplierIds,
            data.slipDate,
            userEmail,
            data.regenerate || false
        );
    }
}
