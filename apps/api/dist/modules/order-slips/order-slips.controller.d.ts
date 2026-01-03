import { OrderSlipsService } from './order-slips.service';
export declare class OrderSlipsController {
    private readonly service;
    constructor(service: OrderSlipsService);
    findAll(): unknown;
    findOne(id: string): unknown;
    generate(userEmail: string): unknown;
}
