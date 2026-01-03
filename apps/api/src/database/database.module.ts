import { Module, Global } from '@nestjs/common';
import { db } from '@sahakar/database';

@Global()
@Module({
    providers: [
        {
            provide: 'DATABASE',
            useValue: db
        }
    ],
    exports: ['DATABASE']
})
export class DatabaseModule { }
