import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: '*', // In production, replace with Vercel URL
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    const port = process.env.PORT || 8080;
    await app.listen(port);
    console.log(`API is running on port: ${port}`);
}
bootstrap();
