import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
    constructor(private readonly service: ProductsService) { }

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
            legacyId?: string;
            productCode?: string;
            itemName: string;
            packing?: string;
            category?: string;
            subcategory?: string;
            mrp?: number;
        }
    ) {
        return await this.service.create(data);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body()
        data: {
            legacyId?: string;
            productCode?: string;
            itemName?: string;
            packing?: string;
            category?: string;
            subcategory?: string;
            mrp?: number;
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
