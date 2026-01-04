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
            aliasName?: string;
            packing?: string;
            category?: string;
            subcategory?: string;
            genericName?: string;
            patent?: string;
            hsnCode?: string;
            productType?: string;
            mrp?: number;
            ptr?: number;
            pts?: number;
            landedCost?: number;
            gstPercent?: number;
            discountPercent?: number;
            stock?: number;
            primarySupplierId?: string;
            secondarySupplierId?: string;
            repId?: string;
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
            aliasName?: string;
            packing?: string;
            category?: string;
            subcategory?: string;
            genericName?: string;
            patent?: string;
            hsnCode?: string;
            productType?: string;
            mrp?: number;
            ptr?: number;
            pts?: number;
            landedCost?: number;
            gstPercent?: number;
            discountPercent?: number;
            stock?: number;
            primarySupplierId?: string;
            secondarySupplierId?: string;
            repId?: string;
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
