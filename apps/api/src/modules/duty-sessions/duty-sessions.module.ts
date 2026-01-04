import { Module } from '@nestjs/common';
import { DutySessionsController } from './duty-sessions.controller';
import { DutySessionsService } from './duty-sessions.service';

@Module({
    controllers: [DutySessionsController],
    providers: [DutySessionsService],
    exports: [DutySessionsService]
})
export class DutySessionsModule { }
