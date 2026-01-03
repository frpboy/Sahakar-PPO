import { ExecutionContext } from '@nestjs/common';
declare const FirebaseAuthGuard_base: import("@nestjs/passport").Type<any>;
export declare class FirebaseAuthGuard extends FirebaseAuthGuard_base {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export {};
