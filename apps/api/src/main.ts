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
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    return app.init();
};

createNestServer(server)
    .then(v => console.log('Nest Ready'))
    .catch(err => console.error('Nest broken', err));

export const api = functions.region('asia-south1').https.onRequest(server);

// Local testing (only run if not exported)
if (require.main === module) {
    async function bootstrap() {
        const app = await NestFactory.create(AppModule);
        app.enableCors({ origin: '*' });
        const port = process.env.PORT || 8080;
        await app.listen(port);
        console.log(`API is running on port: ${port}`);
    }
    bootstrap();
}
