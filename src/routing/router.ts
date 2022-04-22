import { WorkerController } from "../controllers/workercontroller";
import { Endware, Middleware, Routing } from "../types";
import { Session } from "../io/input";
import { DurableObjectController } from "../controllers/durableobjectcontroller";
import { pathToRegexp, match, parse, compile } from "path-to-regexp";
import { dataToResponse } from "../io/output";

/**
 * A router class implementing path-to-regexp
 */
export class Router{

    static routes: Routing[] = []; // Method, host, map, Resource, propertyKey
    static bindings: object = {};
    static middleware: Middleware[] = [];
    static endware: Endware[] = [];

    static useBefore(middleware: Middleware){
        Router.middleware.push(middleware);
    }

    static useAfter(endware: Endware){
        Router.endware.push(endware);
    }

    /**
     * Gather and use all routing information from the given controller
     * @param target Controller to be added to router registry
     */
    static register(target: WorkerController){
        (target as any)?.routes.forEach((route: Routing) => {
            Router.routes.push(route);
        });
        console.log(`Registered ${(target as any).name} means router now has ${Router.routes.length} routes`);
    }

    static async route(session: Session): Promise<any>{
        // Find the registered route matching the session
        let targetRoute: Routing = undefined;
        for(const route of Router.routes){
            if(route.method === session.request.method || route.method === "ANY"){
                console.log("Method match:", route.route);
                const params = []; // TODO: Actually parse params
                const regex = pathToRegexp(route.route, params); // TODO: Can we precompile regexps during build step?
                const parsed = regex.exec(session.request.pathname); // TODO: We need to check the optional host
                console.log(parsed);
                if(parsed){
                    session.request.params = params;
                    targetRoute = route;
                    break;
                }
            }
        }
        if(!targetRoute)
            return new Response(null, {status: 404});
        // TODO: Enact all middleware on the request
        
        // Route the request
        let response: Promise<any> = undefined;
        // Check if we're routing to a D/O
        if(targetRoute.controller instanceof DurableObjectController){
            // Gather the DO namespace we're targeting
            const targetNS: DurableObjectNamespace = (globalThis.env[targetRoute.DOBinding] as DurableObjectNamespace);
            // Attempt to gather targeting object if dev has specified
            const targetDO = (targetRoute.controller as any).DOTarget?.(targetNS, session, session);
            // Base target the default id
            let targetID: DurableObjectId = targetNS.idFromName("default");
            // If we received targeting info use it
            if (targetDO?.name){
                targetID = targetNS.idFromName(targetDO.name);
            } else if (targetDO?.idstring){
                targetID = targetNS.idFromString(targetDO.idstring);
            } else if (targetDO?.id){
                targetID = targetDO.id;
            }
            // Construct the DO stub to call upon
            const remoteObject = targetNS.get(targetID);
            // Generate a targeted request to avoid routing again and pass it off
            response = remoteObject.fetch(await session.request.createTargetRequest(targetRoute.propertyKey));
        } else { // Routing to a local Controller function
            const targetController = new (targetRoute.controller as any).constructor(globalThis.env);
            targetController.addKVBindings();
            response = targetController[targetRoute.propertyKey](session, session);
        }
        // TODO: Enact all endware on the response
        const validResponse: Response = dataToResponse(await response);
        return validResponse;
    }
}