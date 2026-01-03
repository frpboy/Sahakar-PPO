"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma.module");
const order_requests_module_1 = require("./modules/order-requests/order-requests.module");
const pending_items_module_1 = require("./modules/pending-items/pending-items.module");
const rep_items_module_1 = require("./modules/rep-items/rep-items.module");
const order_slips_module_1 = require("./modules/order-slips/order-slips.module");
const slip_items_module_1 = require("./modules/slip-items/slip-items.module");
const analysis_module_1 = require("./modules/analysis/analysis.module");
const auth_module_1 = require("./modules/auth/auth.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            order_requests_module_1.OrderRequestsModule,
            pending_items_module_1.PendingItemsModule,
            rep_items_module_1.RepItemsModule,
            order_slips_module_1.OrderSlipsModule,
            slip_items_module_1.SlipItemsModule,
            analysis_module_1.AnalysisModule
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map