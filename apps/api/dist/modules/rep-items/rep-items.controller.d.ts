import { RepItemsService } from './rep-items.service';
export declare class RepItemsController {
    private readonly service;
    constructor(service: RepItemsService);
    findAll(): unknown;
    update(id: string, body: any): unknown;
}
