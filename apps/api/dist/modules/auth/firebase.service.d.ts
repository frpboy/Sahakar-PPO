import { OnModuleInit } from '@nestjs/common';
export declare class FirebaseService implements OnModuleInit {
    onModuleInit(): void;
    verifyToken(idToken: string): Promise<import("firebase-admin/lib/auth/token-verifier").DecodedIdToken>;
}
