export * from "./prechecks";

const JWT = require("@tsndr/cloudflare-worker-jwt");
import { InboundRequest } from "../io/input";

/**
 * Basic implementation for JWT issuing, reading, and validation
 */
export const jwt = {
    sign: (message: object) => {
        return JWT.sign(message, globalThis.env.JWT_KEY);
    },
    verify: (token: string) => {
        return JWT.verify(token, globalThis.env.JWT_KEY);
    },
    read: (token: string) => {
        return JWT.decode(token);
    },
    read_if_valid: (token: string) => {
        return jwt.verify(token) ? jwt.read(token) : false;
    }
};

export class Client{
    
    roles: string[];
    perms: string[];
    internal: number;
    name: string;
    ttl: number;

    constructor(request: InboundRequest){
        // TOOD: Construct the client
    }
}