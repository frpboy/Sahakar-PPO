import { Module } from '@nestjs/common';
import { OrderSlipsController } from './order-slips.controller';
import { OrderSlipsService } from './order-slips.service';

@Module({
    controllers: [OrderSlipsController],
    providers: [OrderSlipsService],
})
export class OrderSlipsModule { }
