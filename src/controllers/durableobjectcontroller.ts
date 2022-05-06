import { Session } from "../io/input";
import { OutboundResponse } from "../io/output";
import { DurableObjectStore } from "../storage/durableobjectstore";
import { WorkerController } from "./workercontroller";


/**
 * Extension of the resource class for items which require
 * data consistency, this functions as a local portal through which
 * the worker can interact with the remote durable object
 */
export abstract class DurableObjectController extends WorkerController{

    storage: any;
    state: DurableObjectState;

    /**
     * Default constructor for remote durable objects
     * @param state state passed by workers runtime
     * @param env The global environment object
     */
    constructor(state: any | null, env: any | null){
        super(env);
        this.state = state; // Access to the state object
        this.storage = new DurableObjectStore(state.storage); // Access to permanent storage
        this.addKVBindings();
        (this as any).onCreate?.(state, env);
    }

    async fetch(request: Request){
        // Generate the (session, response) pair
        const json: any = await request.json();
        const session = new Session(json.session);
        session.logger.live = this.liveLogging;
        const response = new OutboundResponse(json.response);

        // Call lifecycle hook
        (this as any).onRequest?.(session, response);

        // Log Entry into the DO
        console.log(`=== DO Executing ${this.constructor.name}.${json.target} ===`);
        
        // Execute the method on the DO and save the response
        await this[json.target](session, response);
        
        // Log exit of DO
        console.log("=== DO Execution Finished ===");

        // Exit the logger gracefully if this is the end of the session
        if(!response.websocket)
            session.logger.close();

        return new Response(JSON.stringify({
            session: await session.toJSON(),
            response: response.toJSON()
        }));
    }
}