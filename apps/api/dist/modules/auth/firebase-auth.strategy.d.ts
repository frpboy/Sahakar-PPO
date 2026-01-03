import { Strategy } from 'passport-jwt';
import { FirebaseService } from './firebase.service';
declare const FirebaseAuthStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class FirebaseAuthStrategy extends FirebaseAuthStrategy_base {
    private readonly firebaseService;
    constructor(firebaseService: FirebaseService);
    validate(payload: any, done: (err: any, user: any) => void): Promise<any>;
    authenticate(req: any, options?: any): Promise<void>;
}
export {};
