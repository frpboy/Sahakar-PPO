import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PpoImportModule } from './modules/ppo-import/ppo-import.module';

@Module({
    imports: [
        AuthModule,
        PpoImportModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }

