import { Injectable } from '@nestjs/common';

export interface AppSettings {
    dateFormat: string;
    currency: string;
    timezone: string;
    autoBackup: boolean;
    notificationsEnabled: boolean;
}

@Injectable()
export class SettingsService {
    // In-memory storage (replace with database in production)
    private settings: AppSettings = {
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        autoBackup: true,
        notificationsEnabled: true
    };

    async getSettings(): Promise<AppSettings> {
        return this.settings;
    }

    async updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
        this.settings = { ...this.settings, ...data };
        return this.settings;
    }
}
