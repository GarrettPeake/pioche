import { WebsocketController } from "../../controllers/websocketcontroller";
import { BaseMap, GetMap, PostMap } from "../../routing";
import { assertStructure } from "..";
import { Session } from "../../io/input";

/**
 * A prebuilt durable object offering live and delayed WebSocket logging
 */
@BaseMap("/logs")
export class LogsDurableObject extends WebsocketController {

    constructor(state: any, env: any) {
        super(state, env);
    }
        
    // Connect to the websocket for the endpoint
    @GetMap("")
    async queryLogs(session: Session){
        // Check request structure
        return this.assertUpgrade(session);
    }

    // Creates log entry for the given sitename
    @PostMap("")
    async addLog(session: Session){
        // Assert that we have a groupingid
        assertStructure(session.request, {groupingid: ()=>true, messages: n=>typeof n === "object"});
        // Get the messages
        const messages = (await session.request.json()).body.messages;
        // Spread the messages on the groupingid
        await this.storage[(await session.request.json()).groupingid].spread(messages);
        // Publish updates
        this.broadcast(messages);
        // Set the response
        return {message: "Log entries added"};
    }

    messageHandler(session: Session, message: string | ArrayBuffer): void {
        // Add history retrieve functionality
        // We don't want to broadcast messages from users
    }

    receiveBroadcast(): boolean {
        return true; // 
    }
}