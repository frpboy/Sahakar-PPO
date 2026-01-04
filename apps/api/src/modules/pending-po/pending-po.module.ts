import { Module } from '@nestjs/common';
import { PendingPoService } from './pending-po.service';
import { PendingPoController } from './pending-po.controller';

@Module({
    controllers: [PendingPoController],
    providers: [PendingPoService],
    exports: [PendingPoService]
})
export class PendingPoModule { }
