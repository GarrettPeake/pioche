import { Client } from "../iam";
import { assertPerms, maskPerms } from "../iam/prechecks";
import { Logger } from "../logging/logger";
import { PermissionedObject } from "../types";
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

    // Always parse immediately
    request = undefined;
    method = undefined;
    url = undefined;
    pathname = undefined;

    // Lazily parsed as needed
    cparams = undefined;
    cquery = undefined;
    cheaders = undefined;
    cbody = undefined;
    cjson = undefined;

    constructor(request: Request){
        let reqUrl = new URL(String(request.url));
        this.request = request
        this.method = request.method.toUpperCase()
        this.url = reqUrl
        this.pathname = reqUrl.pathname
    }

    get params(){
        let rval = this.cparams || undefined; // TODO: Implement generation
        this.cparams = rval
        return rval
    }
    get query(){
        let rval = this.cquery || undefined; // TODO: Implement generation
        this.cquery = rval
        return rval
    }
    get headers(){
        let rval = this.cheaders || undefined; // TODO: Implement generation
        this.cheaders = rval
        return rval
    }
    get body(){
        let rval = this.cbody || undefined; // TODO: Implement generation
        this.cbody = rval
        return rval
    }
    get json(){
        let rval = this.cjson || undefined; // TODO: Implement generation
        this.cjson = rval
        return rval
    }
}

export function AcceptContent(type: string){
    console.log('Accept functionality not implemented')
}