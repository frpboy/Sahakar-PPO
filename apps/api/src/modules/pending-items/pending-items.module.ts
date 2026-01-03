import { Module } from '@nestjs/common';
import { PendingItemsController } from './pending-items.controller';
import { PendingItemsService } from './pending-items.service';

@Module({
    controllers: [PendingItemsController],
    providers: [PendingItemsService],
})
export class PendingItemsModule { }
