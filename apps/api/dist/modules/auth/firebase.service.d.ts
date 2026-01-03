import { OnModuleInit } from '@nestjs/common';
export declare class FirebaseService implements OnModuleInit {
    onModuleInit(): void;
    verifyToken(idToken: string): unknown;
}
