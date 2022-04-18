export { Router } from "./router";
export * from "./delegator";

import { WorkerController } from "../controllers/workercontroller";
import { HTTPMethod, Routing } from "../types";

function assertRouteFormat(route: string){
    // @tsndr router uses r.url.split('/').filter(i => i) rather than enforces '/' rules, doesn't account for dir/file tho
    if(route[0] !== "/") // Ensure route begins with a slash
        throw Error(`Mapping '${route}' invalid, routes must begin with '/'`);
    // if(route[route.length - 1] === '/') // TODO: maybe follow Flask's rules?
    //    throw Error(`Route '${route}' invalid, all routes must begin with '/'`)
    if(/\s/g.test(route))
        throw Error(`Mapping '${route}' invalid, routes may not contain whitespace`);
    return route; // Return route if nothing's wrong
}

function Route(method: HTTPMethod, route: string) { // Decorator Factory for put mappings
    return function (target: WorkerController, propertyKey: string) {
        const newRoute: Routing = {
            method: method, 
            route: assertRouteFormat(route),
            controller: target,
            propertyKey
        };
        if((target.constructor as any).routes)
            (target.constructor as any).routes.push(newRoute);
        else
            (target.constructor as any).routes = [newRoute];
    };
}

/**
 * Decorator for controller base mapping with optional host parameter
 * @param base Base route for all methods within the controller
 * @param host Optional route declaration for implementing subdomain routing
 */
export function BaseMap(base: string, {host = ""} = {}) { // Decorator Factory for class base mappings
    return function (target: any) {
        if(target.routes)
            target.routes.forEach((route: Routing) => {
                route.host = host;
                route.route = assertRouteFormat(base) + route.route;
                console.log(`Route ${route.method} ${route.host}.domain.tld${route.route} -> ${route.controller}.${route.propertyKey}`);
            });
    };
}

// Mapping functions for each type of request
export function GetMap(route: string){
    return Route("GET", route);
}
export function HeadMap(route: string){
    return Route("HEAD", route);
}
export function PostMap(route: string){
    return Route("POST", route);
}
export function PutMap(route: string){
    return Route("PUT", route);
}
export function DeleteMap(route: string){
    return Route("DELETE", route);
}
export function ConnectMap(route: string){
    return Route("CONNECT", route);
}
export function OptionsMap(route: string){
    return Route("OPTIONS", route);
}
export function TraceMap(route: string){
    return Route("TRACE", route);
}
export function PatchMap(route: string){
    return Route("PATCH", route);
}
export function AnyMap(route: string){
    return Route("ANY", route);
}