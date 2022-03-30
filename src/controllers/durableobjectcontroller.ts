import { Session } from "../io/input";
import { WorkerController } from "./workercontroller";


/**
 * Extension of the resource class for items which require
 * data consistency, this functions as a local portal through which
 * the worker can interact with the remote durable object
 */
export abstract class DurableObjectController extends WorkerController{

    storage: DurableObjectStorage;
    state: DurableObjectState;
    target: {id?: DurableObjectId, name?: string, hex?: string};

    /**
     * Default constructor for remote durable objects
     * @param state state passed by workers runtime
     * @param env The global environment object
     */
    constructor(state: any | null, env: any | null){
        super(env);
        this.state = state; // Access to the state object
        this.storage = state.storage; // Access to permanent storage
    }

    async fetch(request: Request){

        // TODO: The request will now include the target and params as well as the original request

        // Generate the session object
        let session = new Session(request)

        // Log Entry into the DO
        session.logger.log(`------- EVENT RECEIVED AT ${this.state.id} DURABLE OBJECT -------`);
        
        // Execute the method on the DO and save the response
        let r_val: Response = await this[session.request.target](session);
        
        // Log exit of DO
        session.logger.log(`-------   END OF EXECUTION AT DURABLE OBJECT   -------`);

        // Exit the logger gracefully
        session.logger.close()
        
        return r_val;
    }
}