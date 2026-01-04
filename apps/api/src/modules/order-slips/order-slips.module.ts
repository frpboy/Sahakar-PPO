import { Module } from '@nestjs/common';
import { OrderSlipsService } from './order-slips.service';
import { OrderSlipsController } from './order-slips.controller';

@Module({
    controllers: [OrderSlipsController],
    providers: [OrderSlipsService],
    exports: [OrderSlipsService]
})
export class OrderSlipsModule { }
