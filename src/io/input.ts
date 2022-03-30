import { ClientSession, PermissionedObject } from "../types";
import { assertStructure } from "../utils";

export class InboundRequest {

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
    csessionid = undefined;

    constructor(request: Request){
        let reqUrl = new URL(String(request.url));
        this.request = request
        this.method = request.method.toUpperCase()
        this.url = reqUrl
        this.pathname = reqUrl.pathname
    }

    get params(){
        let rval = this.cparams || GNEERATR
        this.cparams = rval
        return rval
    }
    get query(){
        let rval = this.cquery || GNEERATR
        this.cquery = rval
        return rval
    }
    get headers(){
        let rval = this.cheaders || GNEERATR
        this.cheaders = rval
        return rval
    }
    get body(){
        let rval = this.cbody || GNEERATR
        this.cbody = rval
        return rval
    }
    get json(){
        let rval = this.cjson || GNEERATR
        this.cjson = rval
        return rval
    }
    get sessionid(){
        let rval = this.csessionid || GNEERATR
        this.csessionid = rval
        return rval
    }

    /**
     * Authorizes a function to run based on a set of requirements
     * returns a failure Response if authorization fails
     * @param requirements A list of requirements for the action
     * @param funct A function to execute and return if the authorization succeeds
     */
     async authorize(requirements: any, funct: () => Response | Promise<Response>){
        return preAuth(this, requirements, funct);
    }

    /**
     * Applies the users ranks to a permissions mask
     * @param permmed A PermissionedObject to resolve
     */
    async assertAuth(permmed: PermissionedObject){
        return assertAuth(this, permmed)
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

export function AcceptContent(type: string){
    console.log('Accept functionality not implemented')
}