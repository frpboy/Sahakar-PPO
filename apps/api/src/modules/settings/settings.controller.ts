import { Controller, Get, Put, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
    constructor(private readonly service: SettingsService) { }

    @Get()
    async getSettings() {
        return await this.service.getSettings();
    }

    @Put()
    async updateSettings(
        @Body() data: {
            dateFormat?: string;
            currency?: string;
            timezone?: string;
            autoBackup?: boolean;
            notificationsEnabled?: boolean;
        }
    ) {
        return await this.service.updateSettings(data);
    }
}
