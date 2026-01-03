import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    onModuleInit() {
        if (admin.apps.length === 0) {
            // In production, Firebase Admin uses service account from environment or IAM
            // For local dev, ensure GOOGLE_APPLICATION_CREDENTIALS is set
            admin.initializeApp({
                credential: admin.credential.applicationDefault()
            });
        }
    }

    async verifyToken(idToken: string) {
        try {
            return await admin.auth().verifyIdToken(idToken);
        } catch (error) {
            throw error;
        }
    }
}
