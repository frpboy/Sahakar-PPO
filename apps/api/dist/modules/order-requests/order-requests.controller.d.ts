import { OrderRequestsService } from './order-requests.service';
export declare class OrderRequestsController {
    private readonly service;
    constructor(service: OrderRequestsService);
    importFile(file: Express.Multer.File, userEmail: string): unknown;
}
