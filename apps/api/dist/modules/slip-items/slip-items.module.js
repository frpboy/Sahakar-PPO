"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlipItemsModule = void 0;
const common_1 = require("@nestjs/common");
const slip_items_controller_1 = require("./slip-items.controller");
const slip_items_service_1 = require("./slip-items.service");
let SlipItemsModule = class SlipItemsModule {
};
exports.SlipItemsModule = SlipItemsModule;
exports.SlipItemsModule = SlipItemsModule = __decorate([
    (0, common_1.Module)({
        controllers: [slip_items_controller_1.SlipItemsController],
        providers: [slip_items_service_1.SlipItemsService],
    })
], SlipItemsModule);
//# sourceMappingURL=slip-items.module.js.map