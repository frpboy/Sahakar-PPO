import { Module } from '@nestjs/common';
import { RepAllocationController } from './rep-allocation.controller';
import { RepAllocationService } from './rep-allocation.service';

@Module({
    controllers: [RepAllocationController],
    providers: [RepAllocationService],
    exports: [RepAllocationService]
})
export class RepAllocationModule { }
