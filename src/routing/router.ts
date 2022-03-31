import { WorkerController } from "../controllers/workercontroller";
import { endware, HTTPMethod, middleware, routing } from "../types";
import { Session } from "../io/input";

/**
 * A router class implementing path-to-regexp
 */
export class Router{

    static routes: routing[]; // Method, host, map, Resource, propertyKey

    static useBefore(middleware: middleware){}

    static useAfter(endware: endware){}

    /**
     * Gather and use all routing information from the given controller
     * @param target Controller to be added to router registry
     * @param binding Binding variable used by the durable object
     */
    static register(target: WorkerController, binding: string){
        
    }

    static route(session: Session): any{
        // Parsed the url to discover the matching target

        // Check whether the target is a durable object

        // Then route the request
        // Construct a reference to the intended durable object
        let id = globalThis.env[EVENT.endpoint].idFromName(this.NAME || EVENT.sitename);
        let remoteObject = globalThis.ENV[EVENT.endpoint].get(id);
        // Pass the request to the Durable Object
        return await remoteObject.fetch("https://dummy-url", {method: "POST", body: JSON.stringify(EVENT)});
    }
}