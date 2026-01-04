import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PpoImportModule } from './modules/ppo-import/ppo-import.module';
import { PendingPoModule } from './modules/pending-po/pending-po.module';
import { OrderSlipsModule } from './modules/order-slips/order-slips.module';
import { BillingModule } from './modules/billing/billing.module';
import { ConflictModule } from './modules/conflict/conflict.module';
import { ProductsModule } from './modules/products/products.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { RepMasterModule } from './modules/rep-master/rep-master.module';
import { UsersModule } from './modules/users/users.module';
import { DutySessionsModule } from './modules/duty-sessions/duty-sessions.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { RawBodyMiddleware } from './common/middleware/raw-body.middleware';

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
        ConflictModule,
        ProductsModule,
        SuppliersModule,
        RepMasterModule,
        UsersModule,
        DutySessionsModule,
        AuditLogsModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RawBodyMiddleware)
            .forRoutes({ path: 'ppo/import/upload', method: RequestMethod.POST });
    }
}

