export * from "./prechecks";

import { InboundRequest } from "../io/input";

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