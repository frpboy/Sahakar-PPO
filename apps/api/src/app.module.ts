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
import { RepAllocationModule } from './modules/rep-allocation/rep-allocation.module';
import { UsersModule } from './modules/users/users.module';
import { DutySessionsModule } from './modules/duty-sessions/duty-sessions.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { NameChangesModule } from './modules/name-changes/name-changes.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { RawBodyMiddleware } from './common/middleware/raw-body.middleware';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        AuthModule,
        PpoImportModule,
        ProductsModule,
        SuppliersModule,
        PendingPoModule,
        OrderSlipsModule,
        BillingModule,
        ConflictModule,
        RepMasterModule,
        UsersModule,
        DutySessionsModule,
        AuditLogsModule,
        NameChangesModule,
        SettingsModule,
        AnalysisModule
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
