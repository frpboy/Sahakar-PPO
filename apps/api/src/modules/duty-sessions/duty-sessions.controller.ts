import { Controller, Get } from '@nestjs/common';
import { DutySessionsService } from './duty-sessions.service';

@Controller('duty-sessions')
export class DutySessionsController {
    constructor(private readonly service: DutySessionsService) { }

    @Get()
    async findAll() {
        return await this.service.findAll();
    }

    @Get('active')
    async findActive() {
        return await this.service.findActive();
    }
}
