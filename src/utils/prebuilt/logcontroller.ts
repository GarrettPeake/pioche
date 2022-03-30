import { WebsocketController } from "../../controllers/websocket";
import { checkPerms } from "../../iam/prechecks";
import { BaseRoute } from "../../routing";
import { assertStructure, DurableResource, JResponse, ResourceSession } from ".."

/**
 * A prebuilt durable object offering live and delayed WebSocket logging
 */
@BaseRoute("/logs")
export class LogsDurableObject extends WebsocketController {

    constructor(state: any, env: any) {
        super(state, env)
    }
        
    // Connect to the websocket for the endpoint
    @GetMap("")
    async queryLogs(){
        // Check request structure
        return this.getUpgrade()
    }

    // Creates log entry for the given sitename
    @PostMap("")
    async addLog(){
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

    messageHandler(message: string | ArrayBuffer): void {
        // Add history functionality
        this.broadcast(message)
    }

    receiveBroadcast(message: string): boolean {
        return true
    }
}