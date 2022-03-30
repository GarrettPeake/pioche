import { Client } from "../iam";
import { InboundRequest } from "../io/input";
import { ClientSession } from "../types";

/**
 * Abstract superclass for the different types of resources
 * Only provides function wrappers and logging functionality
 */
export abstract class Controller{

    static routes: string[] = []; // All routes advertised by the given resource
    static liveLogging: boolean = false; // Whether to post each log as they come in
    static env: any = {}; // Set by fetch functions on each host

    /**
     * Resolve the event based on it's method and data
     * @param session The ClientSession that triggered the worker
     * @param environment The environment the worker is in
     */
    abstract handleRequest(request: InboundRequest, client: Client, environment: any): Promise<any>;
}