import { SlipItemsService } from './slip-items.service';
export declare class SlipItemsController {
    private readonly service;
    constructor(service: SlipItemsService);
    updateStatus(id: string, body: any): unknown;
}
