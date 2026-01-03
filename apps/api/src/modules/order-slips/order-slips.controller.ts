import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { OrderSlipsService } from './order-slips.service';

@Controller('order-slips')
export class OrderSlipsController {
    constructor(private readonly service: OrderSlipsService) { }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post('generate')
    generate(@Body('userEmail') userEmail: string) {
        const email = userEmail || 'system@sahakar.com';
        return this.service.generateSlips(email);
    }
}
