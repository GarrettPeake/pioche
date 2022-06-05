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

    protected storage: DurableObjectStore;
    protected state: DurableObjectState;

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
        // A durable object can only respond with a websocket to a cross environment request with
        // The "Upgrade: websocket" header. A fetch request specifying said header cannot have a body
        // Thus websocket endpoints will not see the results of preHandlers
        // Given that a websocket also cannot be serialized, it has special handling upon return also
        // This means that websocket endpoints will not pass through postHandlers.
        let session: Session;
        let response: OutboundResponse;
        if (request.headers.get("upgrade") === "websocket"){
            session = new Session(request);
            session.request.params = JSON.parse(session.request.query.params);
            session.request.query = JSON.parse(session.request.query.query);
            response = new OutboundResponse();
        } else {
            const json: any = await request.json();
            session = new Session(json.session);
            response = new OutboundResponse(json.response);
        }
        session.logger.live = this.liveLogging;
        const target = session.request.pathname.slice(1);

        // Call lifecycle hook
        (this as any).onRequest?.(session, response);

        // Log Entry into the DO
        console.log(`=== DO Executing ${this.constructor.name}.${target} ===`);
        
        // Execute the method on the DO and save the response
        await this[target](session, response);
        
        // Log exit of DO
        console.log("=== DO Execution Finished ===");

        // Exit the logger gracefully if this is the end of the session
        if(!response.websocket)
            session.logger.close();
        else
            return new Response(null, { status: 101, webSocket: response.websocket });

        return new Response(JSON.stringify({
            session: await session.toJSON(),
            response: response.toJSON()
        }));
    }
}