import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PpoImportModule } from './modules/ppo-import/ppo-import.module';
import { PendingPoModule } from './modules/pending-po/pending-po.module';
import { OrderSlipsModule } from './modules/order-slips/order-slips.module';
import { BillingModule } from './modules/billing/billing.module';
import { ConflictModule } from './modules/conflict/conflict.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        AuthModule,
        PpoImportModule,
        PendingPoModule,
        OrderSlipsModule,
        BillingModule,
        ConflictModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }

