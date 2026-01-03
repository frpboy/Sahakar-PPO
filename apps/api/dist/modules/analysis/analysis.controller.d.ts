import { AnalysisService } from './analysis.service';
export declare class AnalysisController {
    private readonly service;
    constructor(service: AnalysisService);
    getStats(): unknown;
    getLedger(limit: string): unknown;
    getGap(): unknown;
}
