import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
    constructor(private readonly service: SuppliersService) { }

    @Get()
    async findAll(@Query('search') search?: string) {
        return await this.service.findAll(search);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.service.findOne(id);
    }

    @Post()
    async create(
        @Body()
        data: {
            supplierCode?: string;
            supplierName: string;
            contactPerson?: string;
            mobile?: string;
            email?: string;
            gstNumber?: string;
            address?: string;
            creditDays?: number;
        }
    ) {
        return await this.service.create(data);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body()
        data: {
            supplierCode?: string;
            supplierName?: string;
            contactPerson?: string;
            mobile?: string;
            email?: string;
            gstNumber?: string;
            address?: string;
            creditDays?: number;
            active?: boolean;
        }
    ) {
        return await this.service.update(id, data);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return await this.service.delete(id);
    }
}
