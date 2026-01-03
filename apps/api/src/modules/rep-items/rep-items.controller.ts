import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { RepItemsService } from './rep-items.service';

@Controller('rep-items')
export class RepItemsController {
    constructor(private readonly service: RepItemsService) { }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.service.updateAllocation(id, body);
    }
}
