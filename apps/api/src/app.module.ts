import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { OrderRequestsModule } from './modules/order-requests/order-requests.module';
import { PendingItemsModule } from './modules/pending-items/pending-items.module';
import { RepItemsModule } from './modules/rep-items/rep-items.module';
import { OrderSlipsModule } from './modules/order-slips/order-slips.module';
import { SlipItemsModule } from './modules/slip-items/slip-items.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        OrderRequestsModule,
        PendingItemsModule,
        RepItemsModule,
        OrderSlipsModule,
        SlipItemsModule,
        AnalysisModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
