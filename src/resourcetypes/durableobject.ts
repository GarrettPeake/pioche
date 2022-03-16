import { JResponse, Logger, WorkerRequest } from "../utils/helpers";
import { Resource } from "./resource";


/**
 * Extension of the resource class for items which require
 * data consistency, this functions as a local portal through which
 * the worker can interact with the remote durable object
 */
export abstract class DurableObjectResource extends Resource{

    _isDurableObject: boolean = false;
    STORAGE: any;
    NAME: string;

    /**
     * Dual local/remote constructor for Durable Objects
     * @param state Name of intended Durable Object, optional
     * @param env The global environment object
     */
    constructor(state: any | null = null, env: any | null){
        super();
        if(typeof state === "string")
            this.NAME = state; // For WS we might want chatrooms, not the global sitename object
        else
            this.STORAGE = state.storage; // Access to permanent storage
        this.ENV = env; // Access to environment
    }

    async fetch(request: Request){
        // Parse the incoming request, will always be in EVENT format
        this.EVENT = await request.json();

        // Note that we are not running on a durable object
        this._isDurableObject = true;

        // Setup logging while preventing recursive calls to logs
        this._logger = new Logger(this.EVENT, this.ENV, this.EVENT.headers['cf-ray']);

        // Log Entry into the DO
        this.log(`------- EVENT RECEIVED AT ${this.EVENT.endpoint} DURABLE OBJECT -------`);
        
        // Execute the method on the DO and save the response
        let r_val: Response = await this.handleRequest(this.EVENT);
        
        // Log exit of DO
        this.log(`-------   END OF EXECUTION AT ${this.EVENT.endpoint} RESOURCE   -------`);

        // Allow post run logging to execute
        if(this._logger)
            this._logger.close();
        
        return r_val;
    }

    /**
     * Handles the difference between worker and DO logic
     * Allows the worker to interact with DOs without any extra logic
     * @param EVENT The event received by the worker
     * @returns A promise containing a valid Response
     */
    async handleRequest(EVENT: WorkerRequest): Promise<Response>{
        if(this._isDurableObject){
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
        } else {
            // Construct a reference to the intended durable object
            let id = this.ENV[EVENT.endpoint].idFromName(this.NAME || EVENT.sitename);
            let remoteObject = this.ENV[EVENT.endpoint].get(id);
            // Pass the request to the Durable Object
            this.log("CALLING STORAGE");
            return await remoteObject.fetch("https://dummy-url", {method: "POST", body: JSON.stringify(EVENT)});
        }
    }
}