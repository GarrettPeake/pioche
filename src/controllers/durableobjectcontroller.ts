import { Session } from "../io/input";
import { OutboundResponse } from "../io/output";
import { DurableObjectStore } from "../storage/durableobjectstore";
import { createStorageProxy } from "../storage/storage";
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
        this.storage = createStorageProxy(new DurableObjectStore(state.storage)); // Access to permanent storage
        this.addKVBindings();
    }

    async fetch(request: Request){
        // Generate the (session, response) pair
        const json: any = await request.json();
        const session = new Session(json.session);
        session.logger.live = this.liveLogging;
        const response = new OutboundResponse(json.response);

        // Log Entry into the DO
        console.log(`=== DO Executing ${this.constructor.name}.${json.target} ===`);
        
        // Execute the method on the DO and save the response
        await this[json.target](session, response);
        
        // Log exit of DO
        console.log("=== DO Execution Finished ===");

        // Exit the logger gracefully if this is the end of the session
        if(!response.webSocket)
            session.logger.close();
        
        /* 
        * **Note to Contributors**: I can't think of any reasons WebSockets can't just receive special
        * treatment and be sent back like this then bypassing endware. Honestly I just couldn't serialize
        * them to allow me to send them back. If you can think of a reason not to do this or a way to
        * transmit them, please open an issue
        */
        if(response.status === 101){ 
            return new Response(null, { status: 101, webSocket: response.webSocket });
        }

        return new Response(JSON.stringify({
            session: await session.toJSON(),
            response: response.toJSON()
        }));
    }
}