import { HTTPMethod } from "../types";

function Route(method: HTTPMethod, route: string) { // Decorator Factory for put mappings
    return function (target: any, propertyKey: string) {
        target.constructor.routes.push(["GET", route, ]);
    };
}

/**
 * Decorator for controller base mapping with optional host parameter
 * @param base Base route for all methods within the controller
 * @param host Optional route declaration for implementing subdomain routing
 */
 export function BaseMap(base: string, {host = ""} = {}) { // Decorator Factory for class base mappings
    // TODO: clean base route for /'s randomly
    return function (target: any) {
        target.baseMapping = base;
    };
}

// Mapping functions for each type of request
export function GetMap(route: string){
    return Route("GET", route)
}
export function HeadMap(route: string){
    return Route("HEAD", route)
}
export function PostMap(route: string){
    return Route("POST", route)
}
export function PutMap(route: string){
    return Route("PUT", route)
}
export function DeleteMap(route: string){
    return Route("DELETE", route)
}
export function ConnectMap(route: string){
    return Route("CONNECT", route)
}
export function OptionsMap(route: string){
    return Route("OPTIONS", route)
}
export function TraceMap(route: string){
    return Route("TRACE", route)
}
export function PatchMap(route: string){
    return Route("PATCH", route)
}
export function AnyMap(route: string){
    return Route("ANY", route)
}