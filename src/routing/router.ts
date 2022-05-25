import { WorkerController } from "../controllers/workercontroller";
import { DOTarget, Middleware, Routing } from "../types";
import { Session } from "../io/input";
import { DurableObjectController } from "../controllers/durableobjectcontroller";
import { pathToRegexp } from "path-to-regexp";
import { OutboundResponse } from "../io/output";

/**
 * A router class implementing path-to-regexp
 */
export class Router{

    static routes: Routing[] = []; // Method, host, map, Resource, propertyKey
    static bindings: [any, string][] = [];
    static preHandlers: Middleware[] = [];
    static postHandlers: Middleware[] = [];

    static useBefore(...handlers: Middleware[]){
        Router.preHandlers = Router.preHandlers.concat(handlers);
    }

    static useAfter(...handlers: Middleware[]){
        Router.postHandlers = Router.postHandlers.concat(handlers);
    }

    static setBindings(binds: [any, string][]){
        Router.bindings = binds;
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

    /**
     * Routes the session, response pair
     * @param session The session object
     * @param response The response object
     * @returns A valid response object
     */
    static async route(session: Session, response: OutboundResponse): Promise<any>{
        // ==== Find the matching route if any ====
        let targetRoute: Routing = undefined;
        const currentRoute = session.request.host + session.request.pathname;
        console.log("Checking known routes against:", currentRoute);
        for(const route of Router.routes){
            console.log("  Route:", route.method, route.route);
            if(route.method === session.request.method || route.method === "ANY"){
                console.log("    ☑️ Method");
                const params = [];
                const regex = pathToRegexp(route.host + route.route, params); // TODO: Can we precompile regexps during build step?
                let parsed = [];
                try{
                    parsed = regex.exec(currentRoute);
                }catch{}
                if(parsed){
                    console.log("    ☑️ Route");
                    session.request.params = {};
                    params.forEach((p, i) => {
                        session.request.params[p.name] = parsed[i+1];
                    });
                    console.log("    ➡️ Routing with Params:", 
                        Object.entries(session.request.params)
                            .filter(([k]) => k!=="host")
                            .map(([k, v]) => `${k}=${v}`).join(", "));
                    targetRoute = route;
                    break;
                }
            }
        }
        if(!targetRoute){
            console.log("No matching route found, setting 404");
            response.status = 404;
        }

        // ==== Enact preHandlers on the request ====
        const routePreHandlers = (targetRoute?.controller as any)?.handlers?.preHandlers?.[targetRoute?.propertyKey] || [];
        const preHandlers = Router.preHandlers.concat(routePreHandlers);
        preHandlers.forEach((handler) => {
            handler(session, response);
        });
    
        // ==== Route the request ====
        if(targetRoute){
            // Route the request to Durable Object if needed
            if(targetRoute.controller instanceof DurableObjectController){
                // Gather the DO namespace we're targeting
                const targetBinding = Router.bindings.filter(([e]) =>
                    targetRoute.controller.constructor["name"] === e.name
                )[0][1];
                const targetNS = (globalThis.env[targetBinding] as DurableObjectNamespace);
                // Gather dev specified target
                const targetDO: DOTarget = (targetRoute.controller as any).TargetDO?.(session, response, targetNS);
                // Base target the default id
                let targetID = targetNS.idFromName("default");
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
                // Serialize (session, response) and append the targeted controller method
                const resp: Response = await remoteObject.fetch(new Request("https://www.dummy-url.com", {
                    method: "POST",
                    body: JSON.stringify({
                        target: targetRoute.propertyKey,
                        session: await session.toJSON(),
                        response: response.toJSON()
                    })
                }));
                // **NOTE TO CONTRIBUTORS**: Read note in DurableObjectController.fetch() for reasoning
                // We treat websockets specially, bypassing postHandlers
                if(resp.status === 101){
                    return resp;
                }
                // Deserialize the data from the durable object back into (session, response)
                const respJson: any = await resp.json();
                session = new Session(respJson.session);
                response = new OutboundResponse({json: respJson.response});
            } else { // Routing to a local Controller function
                const targetController = new (targetRoute.controller as any).constructor(globalThis.env);
                session.logger.live = targetController.liveLogging;
                targetController.addKVBindings();
                await targetController[targetRoute.propertyKey](session, response);
            }
        }

        // ==== Enact postHandlers on the request ====
        const routePostHandlers = (targetRoute?.controller as any)?.handlers?.postHandlers?.[targetRoute?.propertyKey] || [];
        const postHandlers = Router.postHandlers.concat(routePostHandlers);
        postHandlers.forEach((handler) => {
            handler(session, response);
        });

        // Convert our response object into a real response
        return response.toResponse();
    }
}