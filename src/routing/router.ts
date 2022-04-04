import { WorkerController } from "../controllers/workercontroller";
import { Endware, HTTPMethod, Middleware, Routing } from "../types";
import { Session } from "../io/input";
import { DurableObjectController } from "../controllers/durableobjectcontroller";

/**
 * A router class implementing path-to-regexp
 */
export class Router{

    static routes: Routing[]; // Method, host, map, Resource, propertyKey
    static bindings: object = {};
    static middleware: Middleware[] = [];
    static endware: Endware[] = [];

    static useBefore(middleware: Middleware){
        this.middleware.push(middleware)
    }

    static useAfter(endware: Endware){
        this.endware.push(endware)
    }

    /**
     * Gather and use all routing information from the given controller
     * @param target Controller to be added to router registry
     * @param binding Binding variable used by the durable object
     */
    static register(target: WorkerController, {binding = ""} = {}){
        this.routes += (target as any).routes.map((route: Routing) => {
            route.DOBinding = binding;
            return route;
        })
    }

    static route(session: Session): any{
        // Find the registered route matching the session

        // Enact all middleware on the request
        
        // Route the request
        let response: Response = undefined;
        if(route.controller instanceof DurableObjectController){ // Check if we're routing to a D/O
            let remoteObject = globalThis.env[route.DOBinding].get(/** Call DOTarget function here */);
            // TODO: How to attach intent and params to the request
            // Pass the request to the Durable Object
            response = remoteObject.fetch("https://dummy-url", {method: "POST", body: JSON.stringify(session)});
        } else {
            let targetController = new route.controller.constructor();
            response = targetController[route.method](session, session)
        }
        // Enact all endware on the response
    }
}