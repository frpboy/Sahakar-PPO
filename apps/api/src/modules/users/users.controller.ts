import { Controller, Get, Put, Param, Body, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly service: UsersService) { }

    @Get()
    async findAll(@Query('search') search?: string) {
        return await this.service.findAll(search);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.service.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() data: {
            name?: string;
            role?: 'SUPER_ADMIN' | 'ADMIN' | 'PROCUREMENT_HEAD' | 'PURCHASE_STAFF' | 'BILLING_HEAD' | 'BILLING_STAFF';
            active?: boolean;
        }
    ) {
        return await this.service.update(id, data);
    }
}
