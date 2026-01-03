import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@sahakar/database';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    onModuleInit(): any;
    onModuleDestroy(): any;
}
