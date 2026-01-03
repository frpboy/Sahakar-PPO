import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { FirebaseService } from './firebase.service';

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(Strategy, 'firebase-auth') {
    constructor(private readonly firebaseService: FirebaseService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // We use a dummy secret because the actual verification is done in the validate method via Firebase Admin
            secretOrKey: 'DUMMY_SECRET',
        });
    }

    async validate(payload: any, done: (err: any, user: any) => void) {
        // The Passport-JWT strategy normally verifies the signature using the secretOrKey.
        // However, for Firebase, we need to verify the token via the Firebase Admin SDK.
        // Because Passport-JWT already parsed it, we can re-verify or just trust the payload if verified.
        // A better approach often is a custom strategy, but we can override the verification logic.
        return payload;
    }

    // Overriding the default JWT verification to use Firebase Admin
    async authenticate(req: any, options?: any) {
        const idToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (!idToken) {
            return this.fail(new UnauthorizedException('Missing token'), 401);
        }

        try {
            const decodedToken = await this.firebaseService.verifyToken(idToken);
            req.user = decodedToken;
            this.success(decodedToken);
        } catch (error) {
            this.fail(new UnauthorizedException('Invalid token'), 401);
        }
    }
}
