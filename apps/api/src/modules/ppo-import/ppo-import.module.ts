import { Module } from '@nestjs/common';
import { PpoImportService } from './ppo-import.service';
import { PpoImportController } from './ppo-import.controller';

@Module({
    controllers: [PpoImportController],
    providers: [PpoImportService],
    exports: [PpoImportService]
})
export class PpoImportModule { }
