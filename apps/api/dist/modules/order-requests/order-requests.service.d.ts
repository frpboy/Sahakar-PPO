import { PrismaService } from '../../prisma.service';
export declare class OrderRequestsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    importOrderFile(file: Express.Multer.File, userEmail: string): unknown;
    private processRow;
}
