import { Controller, Get, Param } from '@nestjs/common';
import { NameChangesService } from './name-changes.service';

@Controller('name-changes')
export class NameChangesController {
    constructor(private readonly service: NameChangesService) { }

    @Get()
    async findAll() {
        return await this.service.findAll();
    }

    @Get('product/:productId')
    async findByProduct(@Param('productId') productId: string) {
        return await this.service.findByProduct(productId);
    }
}
