export { Router } from "./router";
export * from "./delegator";

import { WorkerController, DurableObjectController } from "../controllers";
import { HTTPMethod, Routing } from "../types";
import { Router } from "./router";

/**
 * Decorator Factroy to append an incomplete submapping to controller class prototype
 * @param method Mapped method
 * @param route Mapped route supporting pathToRegexp
 * @param enabled Whether or not to enable the route in deployment
 * @returns Configured decorator
 */
function subMap(method: HTTPMethod, route: string, enabled: boolean) { // Decorator Factory for mappings
    return function (target: WorkerController, propertyKey: string) {
        if(enabled){
            const newRoute: Routing = {
                method, 
                route: route,
                controller: target,
                propertyKey
            };
            if((target.constructor as any).routes)
                (target.constructor as any).routes.push(newRoute);
            else
                (target.constructor as any).routes = [newRoute];
        }
    };
}

/**
 * Decorator for controller base mapping with optional host parameter
 * @param base Base route for all methods within the controller
 * @param host Optional route declaration for implementing subdomain routing
 * @param DOBinding Optional binding used for DurableObjectControllers
 * @param enabled Optioanl parameter allowing for controller Mappings to be disabled
 */
export function BaseMap(base: string, {host = "", DOBinding = undefined, enabled = true} = {}) {
    return function (target: any) {
        if(target.routes && enabled){
            target.routes.forEach((route: Routing) => {
                // Assert bindings were provided for DurableObjectControllers
                if(route.controller instanceof DurableObjectController && !DOBinding)
                    throw Error("@BaseMap Decorators on DurableObjectControllers must provide a DOBinding argument");
                route.DOBinding = DOBinding;
                
                // Append host data to each route
                route.host = host;
                route.route = base + route.route; // Don't allow "//" at the beginning

                console.log(`Route ${route.method} ${route.host}...${route.route} -> ${(target as any).name}.${route.propertyKey}`);
            });
            Router.register(target); // Register all of the target's mappings with the Router
        }
    };
}

// Mapping functions for each type of request
export function GetMap(route: string, {enabled = true} = {}){
    return subMap("GET", route, enabled);
}
export function HeadMap(route: string, {enabled = true} = {}){
    return subMap("HEAD", route, enabled);
}
export function PostMap(route: string, {enabled = true} = {}){
    return subMap("POST", route, enabled);
}
export function PutMap(route: string, {enabled = true} = {}){
    return subMap("PUT", route, enabled);
}
export function DeleteMap(route: string, {enabled = true} = {}){
    return subMap("DELETE", route, enabled);
}
export function ConnectMap(route: string, {enabled = true} = {}){
    return subMap("CONNECT", route, enabled);
}
export function OptionsMap(route: string, {enabled = true} = {}){
    return subMap("OPTIONS", route, enabled);
}
export function TraceMap(route: string, {enabled = true} = {}){
    return subMap("TRACE", route, enabled);
}
export function PatchMap(route: string, {enabled = true} = {}){
    return subMap("PATCH", route, enabled);
}
export function AnyMap(route: string, {enabled = true} = {}){
    return subMap("ANY", route, enabled);
}