import { Resource } from "../resourcetypes/resource";
import { WorkerRequest } from "../utils/helpers";
import { HTTPMethod, Methods } from "./utils";

/**
 * A router class implementing path-to-regexp
 */
export class Router{

    routes: [HTTPMethod | Methods, string, Resource, string][]; // Method, route, Resource, propertyKey

    constructor(routes: [HTTPMethod | Methods, string, Resource, string][]){
        this.routes = routes;
    }

    route(request: WorkerRequest){

    }
}