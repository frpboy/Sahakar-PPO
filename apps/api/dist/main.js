"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.createNestServer = void 0;
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const app_module_1 = require("./app.module");
const express = require("express");
const functions = require("firebase-functions/v1");
const server = express();
const createNestServer = async (expressInstance) => {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressInstance));
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    return app.init();
};
exports.createNestServer = createNestServer;
(0, exports.createNestServer)(server)
    .then(v => console.log('Nest Ready'))
    .catch(err => console.error('Nest broken', err));
exports.api = functions.region('asia-south1').https.onRequest(server);
if (require.main === module) {
    async function bootstrap() {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        app.enableCors({ origin: '*' });
        const port = process.env.PORT || 8080;
        await app.listen(port);
        console.log(`API is running on port: ${port}`);
    }
    bootstrap();
}
//# sourceMappingURL=main.js.map