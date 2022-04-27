import { WorkerController } from "../controllers/workercontroller";
import { DOTarget, Endware, Middleware, Routing } from "../types";
import { Session } from "../io/input";
import { DurableObjectController } from "../controllers/durableobjectcontroller";
import { pathToRegexp, match, parse, compile } from "path-to-regexp";
import { OutboundResponse } from "../io/output";

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
        // Generate our response object to be passed around
        let response = new OutboundResponse();

        // ==== Find the matching route if any ====
        let targetRoute: Routing = undefined;
        for(const route of Router.routes){
            if(route.method === session.request.method || route.method === "ANY"){
                console.log("Method match:", route.route);
                const params = [];
                const regex = pathToRegexp(route.host + route.route, params); // TODO: Can we precompile regexps during build step?
                const parsed = regex.exec(session.request.url.hostname + session.request.pathname); // TODO: We need to check the optional host
                if(parsed){
                    session.request.params = {};
                    params.forEach((p, i) => {
                        session.request.params[p.name] = parsed[i+1];
                    });
                    console.log(`Matched ${route.host}${route.route} route with params: `, JSON.stringify(session.request.params));
                    targetRoute = route;
                    break;
                }
            }
        }
        if(!targetRoute)
            response.status = 404;
        // TODO: Enact all middleware on the request
    
        // ==== Route the request ====
        if(targetRoute){
            // Route the request to Durable Object if needed
            if(targetRoute.controller instanceof DurableObjectController){
                // Gather the DO namespace we're targeting
                const targetNS = (globalThis.env[targetRoute.DOBinding] as DurableObjectNamespace);
                // Gather DEV
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
                // We treat websockets specially, bypassing endware
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
                response = await targetController[targetRoute.propertyKey](session, response);
            }
        }
        // TODO: Enact all endware on the response, this should be done for 404's

        // Turn whatever data the controller gave us into a response
        return response.toResponse();
    }
}