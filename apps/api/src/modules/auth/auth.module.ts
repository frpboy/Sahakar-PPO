import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthStrategy } from './firebase-auth.strategy';
import { AuthController } from './auth.controller';

@Module({
    imports: [PassportModule.register({ defaultStrategy: 'firebase-auth' })],
    controllers: [AuthController],
    providers: [FirebaseService, FirebaseAuthStrategy],
    exports: [FirebaseService],
})
export class AuthModule { }
