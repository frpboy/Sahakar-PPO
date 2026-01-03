import { Controller, Patch, Param, Body } from '@nestjs/common';
import { SlipItemsService } from './slip-items.service';

@Controller('slip-items')
export class SlipItemsController {
    constructor(private readonly service: SlipItemsService) { }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() body: any
    ) {
        const { userEmail, ...data } = body;
        const email = userEmail || 'warehouse@sahakar.com';
        return this.service.updateStatus(id, data, email);
    }
}
