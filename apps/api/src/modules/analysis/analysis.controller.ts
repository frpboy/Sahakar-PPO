import { Controller, Get, Query } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) {}

    @Get('stats')
    async getStats() {
        return this.analysisService.getStats();
    }

    @Get('ledger')
    async getLedger(@Query('limit') limit?: number) {
        return this.analysisService.getLedger(limit);
    }

    @Get('gap')
    async getGap() {
        return this.analysisService.getGapAnalysis();
    }

    @Get('supplier-reliability')
    async getSupplierReliability() {
        return this.analysisService.getSupplierReliability();
    }

    @Get('fraud-alerts')
    async getFraudAlerts() {
        return this.analysisService.getFraudAlerts();
    }

    @Get('aging-report')
    async getAgingReport() {
        return this.analysisService.getAgingReport();
    }
}
