"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const order_requests_controller_1 = require("./order-requests.controller");
const order_requests_service_1 = require("./order-requests.service");
let OrderRequestsModule = class OrderRequestsModule {
};
exports.OrderRequestsModule = OrderRequestsModule;
exports.OrderRequestsModule = OrderRequestsModule = __decorate([
    (0, common_1.Module)({
        controllers: [order_requests_controller_1.OrderRequestsController],
        providers: [order_requests_service_1.OrderRequestsService],
    })
], OrderRequestsModule);
//# sourceMappingURL=order-requests.module.js.map