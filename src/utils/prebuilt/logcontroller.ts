import { WebsocketController } from "../../controllers/websocketcontroller";
import { BaseMap, GetMap, PostMap } from "../../routing";
import { assertStructure } from ".."
import { Session } from "../../io/input";

/**
 * A prebuilt durable object offering live and delayed WebSocket logging
 */
@BaseMap("/logs")
export class LogsDurableObject extends WebsocketController {

    constructor(state: any, env: any) {
        super(state, env)
    }
        
    // Connect to the websocket for the endpoint
    @GetMap("")
    async queryLogs(session: Session){
        // Check request structure
        return this.assertUpgrade(session)
    }

    // Creates log entry for the given sitename
    @PostMap("")
    async addLog(session: Session){
        // Assert that we have a loggroup
        assertStructure(session.request, {groupingid: ()=>true, messages: n=>typeof n === "object"})
        // Get key from storage
        let old_data: object[] = await this.storage.get(session.request.json.groupingid) || []
        // Append list of new objects to key
        old_data = old_data.concat(session.request.json.body.messages);
        console.log(old_data)
        // Write key back to storage
        await this.storage.put(this.EVENT.body.loggroup, old_data)
        // Publish updated list to broadcast
        this.broadcast(old_data);
        // Set the response
        return {message: "Log entry added"};
    }

    messageHandler(message: string | ArrayBuffer): void {
        // Add history retrieve functionality
        // We don't want to broadcast messages from users
    }

    receiveBroadcast(message: string): boolean {
        return false
    }
}