import { Controller, Get, Post, Body, Param, Request, Query, Patch, UseGuards, ForbiddenException } from '@nestjs/common';
import { OrderSlipsService } from './order-slips.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('order-slips')
@UseGuards(FirebaseAuthGuard)
export class OrderSlipsController {
    constructor(private readonly service: OrderSlipsService) { }

    @Get()
    async listSlips(@Query() query: any) {
        return await this.service.getAllSlips(query);
    }

    @Post('generate')
    async generateSlips(
        @Body() data: {
            supplierNames: string[];
            slipDate: string;
        },
        @Request() req: any
    ) {
        const user = req.user;
        // Role Guard: SUPER_ADMIN or PROCUREMENT_HEAD
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'PROCUREMENT_HEAD') {
            throw new ForbiddenException('Unauthorized: Only Super Admin or Procurement Head can generate slips.');
        }

        const userEmail = user.email || 'system@sahakar.local';
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

    @Patch(':id/items/:itemId/status')
    async updateItemStatus(
        @Param('id') slipId: string,
        @Param('itemId') itemId: string,
        @Body() payload: any,
        @Request() req: any
    ) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.updateItemStatus(slipId, itemId, payload, userEmail);
    }
}
