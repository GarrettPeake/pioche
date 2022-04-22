import { Session } from "../io/input";
import { dataToResponse } from "../io/output";
import { DurableObjectStore } from "../storage/durableobjectstore";
import { createStorageProxy } from "../storage/storage";
import { WorkerController } from "./workercontroller";


/**
 * Extension of the resource class for items which require
 * data consistency, this functions as a local portal through which
 * the worker can interact with the remote durable object
 */
export abstract class DurableObjectController extends WorkerController{

    storage: DurableObjectStore; // TODO: We want this to be both any and typed...
    state: DurableObjectState;

    /**
     * Default constructor for remote durable objects
     * @param state state passed by workers runtime
     * @param env The global environment object
     */
    constructor(state: any | null, env: any | null){
        super(env);
        this.state = state; // Access to the state object
        this.storage = createStorageProxy(new DurableObjectStore(state.storage)); // Access to permanent storage
        this.addKVBindings();
    }

    async fetch(request: Request){
        // Generate the session object
        const session = new Session(request);
        // Undo the request targeting within the request object
        const targetHandler = await session.request.parseTargetRequest();

        // Log Entry into the DO
        console.log(`------- EVENT RECEIVED AT ${this.state.id} DURABLE OBJECT -------`);
        
        // Execute the method on the DO and save the response
        const r_val: Response = dataToResponse(await this[targetHandler](session, session));
        
        // Log exit of DO
        console.log("-------   END OF EXECUTION AT DURABLE OBJECT   -------");

        // Exit the logger gracefully
        session.logger.close();
        
        return r_val;
    }
}