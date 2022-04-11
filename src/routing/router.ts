import { WorkerController } from "../controllers/workercontroller";
import { Endware, Middleware, Routing } from "../types";
import { Session } from "../io/input";
import { DurableObjectController } from "../controllers/durableobjectcontroller";
import { pathToRegexp, match, parse, compile } from "path-to-regexp";

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
        let targetRoute: Routing;
        for(const route of this.routes){
            if([route.method, 'ANY'].includes(session.request.method)){
                let params = [];
                let regex = pathToRegexp(route.host + route.route, params); // TODO: Can we precompile regexps during build step? 
                let parsed = regex.exec(session.request.host + session.request.pathname);
                if(parsed){
                    session.request.params = params;
                    targetRoute = route;
                }
            }
        }
        // Enact all middleware on the request
        
        // Route the request
        let response: Promise<Response> = undefined;
        // Check if we're routing to a D/O
        if(targetRoute.controller instanceof DurableObjectController){
            // Call the function which generates our DO target
            let targetNS: DurableObjectNamespace = (globalThis.env[targetRoute.DOBinding] as DurableObjectNamespace)
            let targetDO = (targetRoute.controller as any)?.DOTarget(targetNS, session, session);
            let targetID: DurableObjectId = targetNS.idFromName('default');
            if (targetDO?.name){
                targetID = targetNS.idFromName(targetDO.name);
            } else if (targetDO?.idstring){
                targetID = targetNS.idFromString(targetDO.idstring)
            } else if (targetDO?.id){
                targetID = targetDO.id;
            }
            let remoteObject = targetNS.get(targetID);
            // Pass the request to the Durable Object
            response = remoteObject.fetch(await session.request.createTargetRequest(targetRoute.propertyKey));
        } else {
            let targetController = new (targetRoute.controller as any).constructor();
            response = targetController[targetRoute.method](session, session)
        }
        // Enact all endware on the response
        return response
    }
}