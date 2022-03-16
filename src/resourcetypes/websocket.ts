import { JResponse, Logger, ResourceSession } from "../utils/helpers";
import { DurableObjectResource } from "./durableobject";


/**
 * Extension of the resource class for items which require
 * websockets, this functions as a local portal through which
 * the worker can interact with the remote durable object
 */
export abstract class DurableObjectWebsocketResource extends DurableObjectResource{

    sessions: ResourceSession[] = [];

    /**
     * Dual local/remote constructor for Durable Objects
     * @param state Name of intended Durable Object, optional
     * @param env The global environment object
     */
    constructor(state: any | null = null, env: any | null = null){
        super(state, env);
    }

    async fetch(request: Request){
        // Parse the incoming request, will always be in EVENT format
        this.EVENT = await request.json();

        // Note that we are not running on a durable object
        this._isDurableObject = true;

        // Setup logging while preventing recursive calls to logs
        if(this.EVENT.endpoint !== "LOGS"){
            this._logger = new Logger(this.EVENT, this.ENV, this.EVENT.headers['cf-ray']);
        }

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

    // Gets an upgrade response for the given websocket
    async getUpgrade(){
        // Check request structure
        if (this.EVENT.headers["upgrade"] !== "websocket")
            return new JResponse(426, "fail", {message: "Must provide Upgrade header with value 'websocket'"});
        // Give the user a websocket
        let pair = new WebSocketPair();
        await this.handleSession(pair[1]);
        return new Response(null, { status: 101, webSocket: pair[0] });
    }

    /**
     * Send a message to all active websocket connections
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

    async handleSession(webSocket: WebSocket) {
        webSocket.accept();
        let session: ResourceSession = {
            connectionTime: Date.now(),
            initialized: false,
            webSocket,
            config: {},
            queue: [],
            received: [],
            connected: false,
            ended: false
        };
        this.sessions.push(session);

        // Set event handlers to receive messages.
        webSocket.addEventListener("message", async (msg) => {
            if(!session.connected){
                try {
                    if (session.ended) {
                        webSocket.close(1011, "WebSocket broken.");
                        return;
                    }
                    // Send the queue
                    session.queue.forEach((queued) => {
                        webSocket.send(queued);
                    });
                    delete session.queue;
                    // Send a ready message
                    webSocket.send(JSON.stringify({ ready: true }));
                } catch (err:any) {
                    webSocket.send(JSON.stringify({ message: "An error occurred during initialization" }));
                }
            }
            session.connected = true;
            this.messageHandler(msg.data);
        });

        // On "close" and "error" events, remove the WebSocket from the sessions list and broadcast
        let closeOrErrorHandler = (evt) => {
            session.ended = true;
            this.sessions = this.sessions.filter((member) => member !== session);
        };
        webSocket.addEventListener("close", closeOrErrorHandler);
        webSocket.addEventListener("error", closeOrErrorHandler);
    }

    // Defines behaviour when receiving a message
    abstract messageHandler(message: string | ArrayBuffer): void;

    // Defines whether a user should receive a broadcast
    // TODO: logic for this is not implemented
    abstract receiveBroadcast(message: string): boolean;

}