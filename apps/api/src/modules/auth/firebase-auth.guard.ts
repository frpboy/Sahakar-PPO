import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FirebaseAuthGuard extends AuthGuard('firebase-auth') {
    // Optionally override to skip auth for public routes (e.g. health check)
    async canActivate(context: ExecutionContext): Promise<boolean> {
        return (await super.canActivate(context)) as boolean;
    }
}
