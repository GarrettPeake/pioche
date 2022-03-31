import jwt from '@tsndr/cloudflare-worker-jwt';

import { DurableObjectController } from "../controllers/durableobjectcontroller";

export class OAuthController extends DurableObjectController{
    
}

/**
 * Basic implementation for JWT issuing, reading, and validation
 */
 export const JWT = {
    sign: (message: object) => {
        return jwt.sign(message, globalThis.env.JWT_KEY)
    },
    verify: (token: string) => {
        return jwt.verify(token, globalThis.env.JWT_KEY)
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

    constructor(request: Request){

    }
}