import { Client } from "../iam";
import { InboundRequest } from "../io/input";
import { Router } from "../routing/router";
import { JResponse, Logger, WorkerRequest } from "../utils";
import { Controller } from "./controller";


/**
 * Extension of the resource class for items which require
 * data consistency, this functions as a local portal through which
 * the worker can interact with the remote durable object
 */
export abstract class DurableObjectController extends Controller{

    _isDurableObject: boolean = false;
    STORAGE: any;
    NAME: string;

    /**
     * Dual local/remote constructor for Durable Objects
     * @param state Name of intended Durable Object, optional
     * @param env The global environment object
     */
    constructor(state: any | null, env: any | null){
        super();
        if(typeof state === "string")
            this.NAME = state; // For WS we might want chatrooms, not the global sitename object
        else
            this.STORAGE = state.storage; // Access to permanent storage
        this.ENV = env; // Access to environment
    }

    async fetch(request: Request){

        // Turn the request into it's useful form
        let proxied = new InboundRequest(request)
        let client = new Client(request)

        // Note that we are now running on a durable object
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
     * @param session The event received by the worker
     * @returns A promise containing a valid Response
     */
    async handleRequest(request: InboundRequest, client: Client, environment: any): Promise<Response>{
        if(this._isDurableObject){
            // TODO: Create a new router
            let router = new Router()
            return router.route(request);
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