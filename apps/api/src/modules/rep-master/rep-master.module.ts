import { Module } from '@nestjs/common';
import { RepMasterController } from './rep-master.controller';
import { RepMasterService } from './rep-master.service';

@Module({
    controllers: [RepMasterController],
    providers: [RepMasterService],
    exports: [RepMasterService]
})
export class RepMasterModule { }
