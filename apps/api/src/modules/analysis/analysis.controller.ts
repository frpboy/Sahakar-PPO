import { Controller, Get, Query } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
    constructor(private readonly service: AnalysisService) { }

    @Get('stats')
    getStats() {
        return this.service.getDashboardStats();
    }

    @Get('ledger')
    getLedger(@Query('limit') limit: string) {
        return this.service.getStatusLedger(limit ? parseInt(limit) : 20);
    }

    @Get('gap')
    getGap() {
        return this.service.getGapAnalysis();
    }
}
