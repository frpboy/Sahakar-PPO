import { PendingItemsService } from './pending-items.service';
export declare class PendingItemsController {
    private readonly service;
    constructor(service: PendingItemsService);
    findAll(): unknown;
    update(id: string, body: any): unknown;
    moveToRep(id: string, userEmail: string): unknown;
}
