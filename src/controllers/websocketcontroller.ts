import { OutboundResponse, Session } from "../io";
import { DurableObjectController } from "./durableobjectcontroller";


/**
 * Extension of the resource class for items which require
 * WebSockets, this functions as a local portal through which
 * the worker can interact with the remote durable object
 */
export abstract class WebsocketController extends DurableObjectController {

    sessions: Session[] = [];

    // Gets an upgrade response for the given websocket
    async assertUpgrade(session: Session, response: OutboundResponse){
        // Check request structure
        if (session.request.headers.get("upgrade") !== "websocket"){
            response.status = 426;
            response.body = "Must provide Upgrade header with value 'websocket'";
            return false;
        }
        // Give the user a websocket
        const pair = new WebSocketPair();
        session.websocket.socket = pair[1];
        await this.addListeners(session);
        response.status = 101;
        response.websocket = pair[0];
        return true;
    }

    /**
     * Gracefully close the logger and remove the session
     * from the session list
     * @param session 
     */
    async closeSession(session: Session){
        session.logger.close(); // Close logger
        const closeHook = !session.websocket.ended;
        session.websocket.ended = true;
        if(closeHook)
            (this as any).onSessionClose(session);
        try{
            session.websocket.socket.close(1011, "WebSocket broken"); // Close websocket
        } catch (e) {
            session.log("Attempt to close failed, websocket already closed");
        }
        this.sessions = this.sessions.filter((member) => member !== session); // Purge session
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
        console.log("Broadcasting message", message);
        this.sessions.forEach(async (session: Session) => {
            const trySend = async (session: Session) => {
                if(this.receiveBroadcast(session, message)){
                    try {
                        session.websocket.socket.send(message);
                    } catch (err) {
                        if(session.websocket.initialized){
                            session.log("Broadcast failed, closing session");
                            await this.closeSession(session);
                        }else{
                            session.log("Broadcast failed, queuing message");
                            session.websocket.tQueue.push(message);
                        }
                    }
                }
            };
            await trySend(session).catch(err => {
                session.log("Error during brodcast");
                session.log(err);
            });
        });
    }

    async addListeners(session: Session) {
        session.websocket.socket.accept();
        session.websocket.connected = true;
        this.sessions.push(session);

        // Set event handlers to receive messages.
        session.websocket.socket.addEventListener("message", async (msg: any) => {
            if(!session.websocket.initialized){
                try{
                    if(session.websocket.tQueue){
                        session.websocket.tQueue.forEach((queued) => {
                            if (typeof queued !== "string") {
                                queued = JSON.stringify(queued);
                            }
                            session.websocket.socket.send(queued);
                        });
                        session.websocket.tQueue = [];
                    }
                }catch (e){
                    session.log("Websocket init failed, closing socket");
                    session.websocket.socket.send(
                        JSON.stringify({ message: "An error occurred during initialization" })
                    );
                    this.closeSession(session);
                }
                try{
                    (this as any).onSocketInit(session, msg.data);
                } catch (e){
                    session.log("onSocketInit failed");
                    session.log(e);
                }
                session.websocket.initialized = true;
            }
            this.messageHandler(session, msg.data);
        });

        // On "close" and "error" events, remove the WebSocket from the sessions list and broadcast
        const closeOrErrorHandler = () => {
            this.closeSession(session);
        };
        session.websocket.socket.addEventListener("close", closeOrErrorHandler);
        session.websocket.socket.addEventListener("error", closeOrErrorHandler);
    }

    // Defines behaviour when receiving a message
    abstract messageHandler(session: Session, message: string | ArrayBuffer): void;

    // Defines whether a user should receive a broadcast
    abstract receiveBroadcast(session: Session, message: string): boolean;
}