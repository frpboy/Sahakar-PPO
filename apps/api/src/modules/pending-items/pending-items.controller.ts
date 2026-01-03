import { Controller, Get, Patch, Post, Body, Param } from '@nestjs/common';
import { PendingItemsService } from './pending-items.service';

@Controller('pending-items')
export class PendingItemsController {
    constructor(private readonly service: PendingItemsService) { }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.service.update(id, body);
    }

    @Post(':id/move-to-rep')
    moveToRep(@Param('id') id: string, @Body('userEmail') userEmail: string) {
        // Default fallback for dev
        const email = userEmail || 'system@sahakar.com';
        return this.service.moveToRep(id, email);
    }
}
