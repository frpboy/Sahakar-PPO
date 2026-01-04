import { Controller, Post, Body, Request } from '@nestjs/common';
import { ConflictService, ConflictResolution } from './conflict.service';

@Controller('conflict')
export class ConflictController {
    constructor(private readonly service: ConflictService) { }

    @Post('resolve')
    async resolveConflict(
        @Body() conflict: ConflictResolution,
        @Request() req: any
    ) {
        const userEmail = req.user?.email || 'system@sahakar.local';
        return await this.service.resolveConflict(conflict, userEmail);
    }
}
