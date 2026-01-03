import { PrismaService } from '../../prisma.service';
export declare class AnalysisService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): unknown;
    getStatusLedger(limit?: number): unknown;
    getGapAnalysis(): unknown;
}
