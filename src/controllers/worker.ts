import { JResponse, Logger, WorkerRequest } from "../utils";
import { Controller } from "./controller";

/**
 * Extension of the resource class for items which require
 * no data consistency, solely local processing
 * these resources can only use KV storage
 */
export abstract class WorkerController extends Controller{

    // KV Namespaces are added as instance variables

    /**
     * Dual local/remote constructor for Durable Objects
     * @param namespaces List of KV namespaces as strings or references, optional
     * @param env The global environment object
     */
    constructor(namespaces: any[] = null, env: any | null = null){
        super();
        // TODO: Init KV namespaces given by a list of names
        this.ENV = env; // Access to environment
    }

    /**
     * Handles the difference between worker and DO logic
     * Allows the worker to interact with DOs without any extra logic
     * @param EVENT The event received by the worker
     * @returns A promise containing a valid Response
     */
    async handleRequest(EVENT: WorkerRequest): Promise<Response>{
        // Route the request -- note: the overriden methods in the derived class will be called
        let r_val: Response | JResponse = new JResponse(404, "fail", {
            message: `The ${EVENT.method} method is not implemented on this resource`
        });
        // Only attempt to execute if the method is defined
        if(typeof (this as any)[EVENT.method] === "function")
            r_val = await (this as any)[EVENT.method]();
        // Format possible JResponse objects into Response Objects
        if(r_val instanceof JResponse)
            r_val = r_val.format();
        if(r_val instanceof Response)
            return r_val;
        return (new JResponse(404, "fail", {message: "Attempted request to invalid method"})).format();
    }
}