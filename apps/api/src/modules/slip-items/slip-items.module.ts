import { Module } from '@nestjs/common';
import { SlipItemsController } from './slip-items.controller';
import { SlipItemsService } from './slip-items.service';

@Module({
    controllers: [SlipItemsController],
    providers: [SlipItemsService],
})
export class SlipItemsModule { }
