import jwt from '@tsndr/cloudflare-worker-jwt';

import { DurableObjectController } from "../controllers/durableobject";

export class OAuthController extends DurableObjectController{
    // TODO: Implement
}

/**
 * Basic implementation for JWT issuing, reading, and validation
 */
 export const JWT = {
    sign: (message: object) => {
        return jwt.sign(message, ENV.JWT_KEY)
    },
    verify: (token: string) => {
        return jwt.verify(token, ENV.JWT_KEY)
    },
    read: (token: string) => {
        return jwt.decode(token)
    },
    read_if_valid: (token: string) => {
        return JWT.verify(token) ? JWT.read(token) : false;
    }
}

export class Client{
    roles: string[];
    perms: string[];
    internal: number;
    name: string;
    ttl: number;
}