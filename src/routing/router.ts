import { Controller } from "../controllers/controller";
import { WorkerRequest } from "../utils";
import { endware, HTTPMethod, middleware } from "../types";

/**
 * A router class implementing path-to-regexp
 */
export class Router{

    static routes: [HTTPMethod, string, Controller, string][]; // Method, route, Resource, propertyKey

    static useBefore(middleware: middleware){}

    static useAfter(endware: endware){}

    /**
     * Gather and use all routing information from the given controller
     * @param target Controller to be added to router registry
     */
    static register(target: Controller){

    }

    route(request: WorkerRequest){
        
    }
}