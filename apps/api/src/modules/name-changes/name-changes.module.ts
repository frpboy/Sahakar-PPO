import { Module } from '@nestjs/common';
import { NameChangesController } from './name-changes.controller';
import { NameChangesService } from './name-changes.service';

@Module({
    controllers: [NameChangesController],
    providers: [NameChangesService],
    exports: [NameChangesService]
})
export class NameChangesModule { }
