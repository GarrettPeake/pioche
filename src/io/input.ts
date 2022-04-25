import { Client } from "../iam";
import { Logger } from "../logging/logger";
import { HTTPMethod } from "../types";


export class Session {
    client: Client;
    request: InboundRequest;
    logger: Logger;
    sessionid: string;
    websocket = {
        socket: undefined,
        connected: false,
        initialized: false,
        ended: false,
        rQueue: [],
        tQueue: [],
        config: {},
        startTime: Date.now()
    };

    constructor(request: Request){
        this.request = new InboundRequest(request);
        this.client = new Client(this.request);
        this.sessionid = this.request.headers?.["cf-ray"];
        this.logger = new Logger(this.sessionid);
    }

    /**
     * Pass through logging information to logger
     * @param info Info to be logged
     */
    async log(info: any){
        this.logger.log(info);
    }

    // TODO: Create session-attaching wrappers for asserting functions
}

export class InboundRequest {

    request: Request = undefined;
    method: HTTPMethod = undefined;
    url: URL = undefined;
    host: string = undefined;
    pathname: string = undefined;
    params: object = undefined;
    query: object = undefined;
    headers: Headers = undefined;
    #cache_body: string = undefined;
    #cache_json: object = undefined;

    constructor(request: Request){
        this.request = request;
        this.method = (request.method.toUpperCase() as HTTPMethod);
        this.url = new URL(String(request.url));
        this.host = this.url.hostname;
        this.pathname = decodeURI(this.url.pathname);
        this.query = Object.fromEntries(new URLSearchParams(this.url.search));
        this.headers = request.headers;
    }

    async body(): Promise<string>{
        if(this.#cache_body === undefined)
            this.#cache_body = await this.request.text();
        return this.#cache_body;
    }

    async json(): Promise<any>{
        if(this.#cache_json === undefined){
            if(this.#cache_body === undefined)
                this.#cache_body = await this.request.text();
            this.#cache_json = JSON.parse(this.#cache_body);
        }
        return this.#cache_json;
    }

    /**
     * Create a request to forward the currently executing request to the correct durable object
     * @param target The target function to be called within the durable object
     * @returns A request object to be executed
     */
    async createTargetRequest(target: string): Promise<Request>{
        return new Request(this.url.toString(), {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify({
                originalMethod: this.method,
                originalContent: await this.body(),
                params: this.params,
                target: target
            })
        });
    }

    /**
     * Assumes itself is a targeted request and undoes it
     * @returns The target handler method for the DO to execute
     */
    async parseTargetRequest(): Promise<string>{
        let reversedRequest = this.request.clone();
        // TODO: We need the session.request.request to be equivalent to the original
        const json = await this.json();
        console.log(json);
        this.params = json.params;
        this.method = json.originalMethod;
        this.#cache_json = json.originalContent; // TODO: Ensure original is JSON format
        this.#cache_body = json.originalContent;
        this.request = reversedRequest;
        return json.target;
    }
}

export function AcceptContent(type: string){
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value = (...args: any) => {return "TODO: acept functionality not supported yet"};
    };
}