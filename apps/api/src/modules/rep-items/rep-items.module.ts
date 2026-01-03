import { Module } from '@nestjs/common';
import { RepItemsController } from './rep-items.controller';
import { RepItemsService } from './rep-items.service';

@Module({
    controllers: [RepItemsController],
    providers: [RepItemsService],
})
export class RepItemsModule { }
