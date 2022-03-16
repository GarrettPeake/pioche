import { assertAuth, PermissionedObject, preAuth } from "../auth/prechecks";
import { User } from "../auth/utils";
import { Logger } from "../logging/logger";
import { HTTPMethod, Methods } from "../routing/utils";

// Interface for incoming events to the worker
export interface WorkerRequest {
    method: HTTPMethod | Methods;       //HTTP Verb used to access the worker
    stub: string;                       // URL stub removing base domain
    args: object;                       // Arguments provided in the route like /:id
    params: object;                     // Query string parameters in object form coalesced by key
    headers: any;                       // Headers provided on the request
    body: any;                          // Body, expected in JSON format
    user: User;                         // User object for use in sessions
}

// Interface for websocket sessions
export interface ResourceSession {
    webSocket: any; // Server socket for the connection
    connectionTime: number; // Time of connection
    connected: boolean; // Whether the socket has connected
    initialized: boolean; // Whether the rx is ready
    ended: boolean; // Whether the socket has closed
    queue: string[]; // Messages needing to be sent
    received: string[]; // Messages received from socket
    config: any; // Things like search prefix, username etc..
}

/**
 * Parent class for resource defined durable objects
 */
export class DurableResource{

    storage: any;
    ENV: any;
    EVENT: WorkerRequest;
    sessions: ResourceSession[] = [];
    _logger: Logger;

    constructor(state: any, env: any) {
        this.storage = state.storage; // Access to permanent storage
        this.ENV = env; // Access to environment
    }

    async fetch(request: any){
        // Parse the incoming request, will always be in EVENT format
        this.EVENT = await request.json();

        // Setup logging while preventing recursive calls to logs
        if(this.EVENT.endpoint !== "LOGS"){
            this._logger = new Logger(this.EVENT, this.ENV, this.EVENT.headers['cf-ray']);
        }

        // Log Entry into the DO
        this.log(`------- EVENT RECEIVED AT ${this.EVENT.endpoint} DURABLE OBJECT -------`);
        
        // Execute the method on the DO and save the response
        let r_val: Response | JResponse = await (this as any)[this.EVENT.method]();
        
        // Format resulting JResponse objects into Response Objects
        if(r_val instanceof JResponse)
        r_val = r_val.format();
        
        // Log exit of DO
        this.log(`-------   END OF EXECUTION AT ${this.EVENT.endpoint} RESOURCE   -------`);

        // Allow post run logging to execute
        if(this._logger)
            this._logger.close();
        
        return r_val;
    }
    
    async log(info: any){
        if(this._logger)
            this._logger.log(info);
        else
            console.log(info);
    }

    /**
     * Simple wrappers to include event object in function call 
     */
    async preAuth(reqs: object, func: ()=>any){ preAuth(this.EVENT, reqs, func); }
    async assertAuth(permmed: PermissionedObject){ assertAuth(this.EVENT, permmed); }
    assertEvent(eformat: object){ return assertStructure(this.EVENT, eformat)}

    /**
     * Helper function to send a message to all active websocket connections
     * @param message Message to be sent to all active sessions
     */
    async broadcast(message: any) {
        // Apply JSON if we weren't given a string to start with.
        if (typeof message !== "string") {
            message = JSON.stringify(message);
        }

        // Iterate over all the sessions sending them messages or removing them
        this.sessions = this.sessions.filter((session) => {
            if (session.connected) {
                try {
                    session.webSocket.send(message);
                    return true;
                } catch (err) {
                    session.ended = true;
                    return false;
                }
            } else {
                // user hasn't finished connecting
                session.queue.push(message);
                return true;
            }
        });
    }

}

/**
 * Response class implementing JSend standard
 */
export class JResponse{

    code: number;
    status: string;
    data: Object;
    headers: Object;
    preflight: boolean;

    constructor(code=500, status='error', data={}, headers={}, preflight=false){
        this.code = code;
        this.status = status;
        this.data = data;
        this.headers = headers;
        this.preflight = preflight;
    }

    /**
     * Provides a unified Response structure based on the JSend standard
     * @returns formatted Response object
     */
    format(){
        let headers = {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE',
            'Allow': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': '*',
            ... this.headers
        }
        if(!this.preflight)
            return new Response(JSON.stringify({status: this.status, data: this.data}), {
                    headers: headers as any,
                    status: this.code as any,
            });
        return new Response(null, {
            headers: headers as any,
        });
    }

    toString(){
        return JSON.stringify({
            code: this.code,
            status: this.status,
            data: this.data,
            headers: this.headers,
            preflight: this.preflight
        });
    }
}

/**
 * Recursively checks a format Object against a given Object
 * For each key in format
 * @param tbf the object to be formatted
 * @param format the required format for object
 *   example:
 *   {
 *       params: {
 *           number: n => typeof n === "string" && n.strip().length === 12,
 *           page: n => typeof n === "int"
 *       },
 *       body: {
 *           message: n => typeof n === "string" && n.length < 255,
 *           subject: n => typeof n === "string" && n.length < 32
 *       }
 *   }
 */
 export function assertStructure(tbf: any, format: any){
    for(var key in format){
        if(typeof format[key] === "function"){ // Function check
            if(!format[key](tbf[key])){
                console.log(`assertStructure f fail: key->${key} fval->${format[key]} oval->${tbf[key]}`)
                return false;
            } else
                format[key] = tbf[key];
        }
        if(typeof format[key] === "object"){ // Recursive formatting check
            format[key] = assertStructure(tbf[key], format[key])
            if(!format[key]){
                console.log(`assertStructure o fail: key->${key} fval->${format[key]} oval->${tbf[key]}`)
                return false;
            }
        }
    }
    return format;
}