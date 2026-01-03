import { Controller, Post, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrderRequestsService } from './order-requests.service';

@Controller('order-requests')
export class OrderRequestsController {
    constructor(private readonly service: OrderRequestsService) { }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    async importFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('userEmail') userEmail: string
    ) {
        if (!file) throw new Error('File is required');
        // Mock userEmail if not sent (Auth later)
        const email = userEmail || 'system@sahakar.com';
        return this.service.importOrderFile(file, email);
    }
}
