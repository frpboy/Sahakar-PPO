import { Module } from '@nestjs/common';
import { ConflictService } from './conflict.service';
import { ConflictController } from './conflict.controller';

@Module({
    controllers: [ConflictController],
    providers: [ConflictService],
    exports: [ConflictService]
})
export class ConflictModule { }
