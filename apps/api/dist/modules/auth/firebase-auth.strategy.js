"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseAuthStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const firebase_service_1 = require("./firebase.service");
let FirebaseAuthStrategy = class FirebaseAuthStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'firebase-auth') {
    constructor(firebaseService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'DUMMY_SECRET',
        });
        this.firebaseService = firebaseService;
    }
    async validate(payload, done) {
        return payload;
    }
    async authenticate(req, options) {
        const idToken = passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (!idToken) {
            return this.fail(new common_1.UnauthorizedException('Missing token'), 401);
        }
        try {
            const decodedToken = await this.firebaseService.verifyToken(idToken);
            req.user = decodedToken;
            this.success(decodedToken);
        }
        catch (error) {
            this.fail(new common_1.UnauthorizedException('Invalid token'), 401);
        }
    }
};
exports.FirebaseAuthStrategy = FirebaseAuthStrategy;
exports.FirebaseAuthStrategy = FirebaseAuthStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], FirebaseAuthStrategy);
//# sourceMappingURL=firebase-auth.strategy.js.map