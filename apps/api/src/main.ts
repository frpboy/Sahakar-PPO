import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as express from 'express';
import * as functions from 'firebase-functions/v1';

const server = express();
let appInitialized = false;

const bootstrap = async (expressInstance) => {
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressInstance),
    );
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    await app.init();
    appInitialized = true;
};

export const api = functions
    .region('asia-south1')
    .runWith({ timeoutSeconds: 300, memory: '512MB' })
    .https.onRequest(async (req, res) => {
        if (!appInitialized) {
            await bootstrap(server);
        }
        server(req, res);
    });

// Local bootstrap removed to prevent deployment analysis side-effects
