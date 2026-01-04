
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
    use(req: any, res: Response, next: NextFunction) {
        // Firebase Cloud Functions pre-parses the body.
        // If it's a multipart request and rawBody exists, we need to restore the stream for Multer.
        if (req.rawBody && req.headers['content-type']?.includes('multipart/form-data')) {
            const stream = new Readable();
            stream.push(req.rawBody);
            stream.push(null);

            // Monkey-patch the request object to behave like the stream
            req.read = stream.read.bind(stream);
            req.pipe = stream.pipe.bind(stream);
            req.on = stream.on.bind(stream);
            req.resume = stream.resume.bind(stream);
            req.pause = stream.pause.bind(stream);
            req.unshift = stream.unshift.bind(stream);
        }
        next();
    }
}
