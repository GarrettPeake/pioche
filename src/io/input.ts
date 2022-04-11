import { Client } from "../iam";
import { assertPerms, maskPerms } from "../iam/prechecks";
import { Logger } from "../logging/logger";
import { HTTPMethod, PermissionedObject } from "../types";
import { assertStructure } from "../utils";


export class Session{
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
    }

    constructor(request: Request){
        this.client = new Client(request)
        this.request = new InboundRequest(request)
        this.sessionid = this.request.headers?.['cf-ray']
        this.logger = new Logger(this.sessionid)
    }

    /**
     * Pass through logging information to logger
     * @param info Info to be logged
     */
    async log(info: any){
        this.logger.log(info)
    }

    /**
     * Authorizes a function to run based on a set of requirements
     * returns a failure Response if authorization fails
     * @param requirements A list of requirements for the action
     * @param funct A function to execute and return if the authorization succeeds
     */
    async assertPerms(requirements: any, funct: () => Response | Promise<Response>){
        return assertPerms(this, requirements);
    }

    /**
     * Applies the users ranks to a permissions mask
     * @param permmed A PermissionedObject to resolve
     */
    async maskPerms(permmed: PermissionedObject){
        return maskPerms(this, permmed)
    }

    /**
     * 
     * @param format Applies format requirements to the event
     * @returns The formatted event, or false
     */
    async assertEvent(format: any){
        return assertStructure(this, format);
    }
}

class InboundRequest {

    request: Request = undefined;
    method: HTTPMethod = undefined;
    url: URL = undefined;
    host: string = undefined;
    pathname: string = undefined;
    params: object = undefined;
    query: object = undefined;
    headers: Headers = undefined;
    body: string | object = undefined;
    json: any = undefined;

    constructor(){
        return this;
    }

    async parse(request: Request){
        // TODO: Ensure that this is not a duplicated request
        this.request = request
        this.method = (request.method.toUpperCase() as HTTPMethod)
        this.url = new URL(String(request.url));
        this.host = this.url.hostname
        this.pathname = this.url.pathname
        this.query = Object.fromEntries(new URLSearchParams(this.url.search))
        this.headers = request.headers;
        // TODO: This must always parse body on worker -> DO requests
        if (['POST', 'PUT', 'PATCH'].includes(this.method)) {
            if (request.headers.has('Content-Type') && request.headers.get('Content-Type').includes('json')) {
                try {
                    this.json = await request.json();
                    this.body = this.json;
                } catch {
                    this.json = {}
                    this.body = ''
                }
            } else {
                try {
                    this.body = await request.text()
                } catch {
                    this.body = ''
                }
            }
        }
    }

    /**
     * Create a request to forward the currently executing request to the correct durable object
     * @param target The target function to be called within the durable object
     * @returns A request object to be executed
     */
    createTargetRequest(target: string): Request{
        return new Request(this.url.toString(), {
            headers: this.headers,
            body: JSON.stringify({
                originalContent: this.body,
                params: this.params,
                target: target
            })
        })
    }

    /**
     * Assumes itself is a targeted request and undoes it
     * @returns The target handler method for the DO to execute
     */
     parseTargetRequest(): string{
        this.params = this.json.params;
        let target = this.json.target;
        this.json = this.json.originalContent;
        this.body = this.json;
        return target;
    }
}

export function AcceptContent(type: string){
    console.log('Accept functionality not implemented')
}