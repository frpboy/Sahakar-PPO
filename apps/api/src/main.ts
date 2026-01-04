import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as express from 'express';
import * as functions from 'firebase-functions/v1';

const server = express();

export const createNestServer = async (expressInstance) => {
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressInstance),
    );
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    return app.init();
};

createNestServer(server)
    .then(v => console.log('Nest Ready'))
    .catch(err => console.error('Nest broken', err));

export const api = functions.region('asia-south1').https.onRequest(server);

// Local testing (only run if not exported/deployed to Firebase)
if (!process.env.FIREBASE_CONFIG) {
    async function bootstrap() {
        console.log('Starting local bootstrap...');
        const app = await NestFactory.create(AppModule);
        app.enableCors({ origin: '*', credentials: true });
        app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
            next();
        });
        const port = process.env.PORT || 8080;
        await app.listen(port, '0.0.0.0');
        console.log(`API is running on: http://localhost:${port}`);
        console.log(`API is running on: http://0.0.0.0:${port}`);
    }
    bootstrap().catch(err => console.error('Bootstrap failed:', err));
}
