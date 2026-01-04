import { Controller, Put, Post, Body, Param, Request } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
    constructor(private readonly service: BillingService) { }

    @Put('slip-items/:id')
    async updateStatus(
        @Param('id') id: string,
        @Body() data: {
            status: string;
            qtyReceived?: number;
            qtyDamaged?: number;
            qtyPending?: number;
            invoiceId?: string;
            notes?: string;
        },
        @Request() req: any
    ) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.updateBillingStatus(id, data, userEmail);
    }

    @Post('duty/start')
    async startDuty(@Request() req: any) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.startDutySession(userEmail);
    }

    @Post('duty/end')
    async endDuty(@Request() req: any) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.endDutySession(userEmail);
    }
}
