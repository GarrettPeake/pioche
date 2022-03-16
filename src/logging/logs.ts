import { checkPerms } from "pioche/auth/prechecks";
import { assertStructure, DurableResource, JResponse, ResourceSession } from "./utils/helpers"

export class LogsDurableObject extends DurableResource{

    constructor(state: any, env: any) {
        super(state, env)
    }
        
    // Gets log for the given sitename
    async GET(){
        // Check request structure
        if (this.EVENT.headers["upgrade"] !== "websocket")
            return new JResponse(426, "fail", {message: "Must provide Upgrade header with value 'websocket'"});
        // Check ranks/permissioning
        if(!checkPerms(this.EVENT, 'logsGet'))
            return new JResponse(403, "fail", {message: "logsGet permission required"});
        // Give the user a websocket
        let pair = new WebSocketPair();
        await this.handleSession(pair[1], "");
        return new Response(null, { status: 101, webSocket: pair[0] });
    }

    // Dunce function
    async PUT(){
        return new JResponse(405, "fail", {message: "Editing logs not supported"});
    }

    // Creates log entry for the given sitename
    async POST(){
        // Assert that we have a loggroup
        assertStructure(this.EVENT, {loggroup: n=>true, messages: n=>typeof n === "object"})
        // Get key from storage
        let old_data = await this.storage.get(this.EVENT.body.loggroup) || []
        // Append list of new objects to key
        old_data = old_data.concat(this.EVENT.body.messages);
        console.log(old_data)
        // Write key back to storage
        await this.storage.put(this.EVENT.body.loggroup, old_data)
        // Publish updated list to broadcast
        this.broadcast(old_data);
        // Set the response
        return new JResponse(200, "success", {message: "Log entry added"});
    }

    // Dunce function
    async DELETE(){
        return new JResponse(405, "fail", {message: "Deleting logs not supported"});
    }

    async handleSession(webSocket, prefix) {
        webSocket.accept();
        let session: ResourceSession = {
            connectionTime: Date.now(),
            initialized: false,
            webSocket,
            config: {prefix},
            queue: [],
            received: [],
            connected: false,
            ended: false
        };
        this.sessions.push(session);

        // Load the last 100 messages from the chat history stored on disk
        let listing = await this.storage.list({ reverse: true, limit: 100 });
        let backlog = [...listing.values()];
        backlog.reverse();
        backlog.forEach((value) => {
            session.queue.push(JSON.stringify(value));
        });

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
                    webSocket.send(JSON.stringify({ error: err.stack }));
                }
            }
            session.connected = true;
        });

        // On "close" and "error" events, remove the WebSocket from the sessions list and broadcast
        // a quit message.
        let closeOrErrorHandler = (evt) => {
            session.ended = true;
            this.sessions = this.sessions.filter((member) => member !== session);
        };
        webSocket.addEventListener("close", closeOrErrorHandler);
        webSocket.addEventListener("error", closeOrErrorHandler);

        // TODO: TESTING setTimeout(()=>{session.websocket.send(`${Date.now()}`)}, 2000);
    }
}