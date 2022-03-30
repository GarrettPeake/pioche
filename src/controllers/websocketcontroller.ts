import { Session } from "../io/input";
import { DurableObjectController } from "./durableobjectcontroller";


/**
 * Extension of the resource class for items which require
 * websockets, this functions as a local portal through which
 * the worker can interact with the remote durable object
 */
export abstract class WebsocketController extends DurableObjectController {

    sessions: Session[] = [];

    /**
     * Dual local/remote constructor for Durable Objects
     * @param state Name of intended Durable Object, optional
     * @param env The global environment object
     */
    constructor(state: any | null = null, env: any | null = null){
        super(state, env);
    }

    // Gets an upgrade response for the given websocket
    async assertUpgrade(session: Session){
        // Check request structure
        if (session.request.headers["upgrade"] !== "websocket")
            return {code: 426, body: "Must provide Upgrade header with value 'websocket'"};
        // Give the user a websocket
        let pair = new WebSocketPair();
        session.websocket.socket = pair[1]
        await this.addListeners(session);
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
            if (session.websocket.connected) {
                try {
                    session.websocket.socket.send(message);
                    return true;
                } catch (err) {
                    session.websocket.ended = true;
                    return false;
                }
            } else {
                // user hasn't finished connecting
                session.websocket.rQueue.push(message);
                return true;
            }
        });
    }

    async addListeners(session: Session) {
        session.websocket.socket.accept();
        this.sessions.push(session);

        // Set event handlers to receive messages.
        session.websocket.socket.addEventListener("message", async (msg) => {
            if(!session.websocket.connected){
                try {
                    if (session.websocket.ended) {
                        session.websocket.socket.close(1011, "WebSocket broken.");
                        return;
                    }
                    // Send the queue
                    session.websocket.rQueue.forEach((queued) => {
                        session.websocket.socket.send(queued);
                    });
                    delete session.websocket.rQueue;
                    // Send a ready message
                    session.websocket.socket.send(JSON.stringify({ ready: true }));
                } catch (err:any) {
                    session.websocket.socket.send(JSON.stringify({ message: "An error occurred during initialization" }));
                }
            }
            session.websocket.connected = true;
            this.messageHandler(msg.data);
        });

        // On "close" and "error" events, remove the WebSocket from the sessions list and broadcast
        let closeOrErrorHandler = (evt) => {
            session.websocket.ended = true;
            this.sessions = this.sessions.filter((member) => member !== session);
        };
        session.websocket.socket.addEventListener("close", closeOrErrorHandler);
        session.websocket.socket.addEventListener("error", closeOrErrorHandler);
    }

    // Defines behaviour when receiving a message
    abstract messageHandler(message: string | ArrayBuffer): void;

    // Defines whether a user should receive a broadcast
    // TODO: logic for this is not implemented
    abstract receiveBroadcast(message: string): boolean;

}