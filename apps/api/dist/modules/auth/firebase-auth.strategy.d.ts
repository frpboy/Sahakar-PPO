import { Strategy } from 'passport-jwt';
import { FirebaseService } from './firebase.service';
declare const FirebaseAuthStrategy_base: new (...args: [opt: any] | [opt: any]) => InstanceType<typeof Strategy> & {
    validate(...args: any[]): unknown | Promise<unknown>;
};
export declare class FirebaseAuthStrategy extends FirebaseAuthStrategy_base {
    private readonly firebaseService;
    constructor(firebaseService: FirebaseService);
    validate(payload: any, done: (err: any, user: any) => void): unknown;
    authenticate(req: any, options?: any): unknown;
}
export {};
