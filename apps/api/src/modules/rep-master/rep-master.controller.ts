import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RepMasterService } from './rep-master.service';

@Controller('rep-master')
export class RepMasterController {
    constructor(private readonly service: RepMasterService) { }

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
            name: string;
            mobile?: string;
            email?: string;
            designation?: string;
        }
    ) {
        return await this.service.create(data);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body()
        data: {
            name?: string;
            mobile?: string;
            email?: string;
            designation?: string;
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
