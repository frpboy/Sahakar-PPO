import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';

@Controller('audit-events')
export class AuditLogsController {
    constructor(private readonly service: AuditLogsService) { }

    @Get()
    async findAll(
        @Query('entityType') entityType?: string,
        @Query('action') action?: string,
        @Query('actor') actor?: string
    ) {
        return await this.service.findAll({ entityType, action, actor });
    }
}
