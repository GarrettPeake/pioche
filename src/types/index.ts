import { WorkerController } from "../controllers/workercontroller";
import { OutboundResponse } from "../io";
import { Session } from "../io/input";

/** A type defining the strings that can be used as methods */
export type HTTPMethod =
    "get" | "GET" |
    "head" | "HEAD" |
    "post" | "POST" |
    "put" | "PUT" |
    "delete" | "DELETE" |
    "connect" | "CONNECT" |
    "options" | "OPTIONS" |
    "trace" | "TRACE" |
    "patch" | "PATCH" |
    "any" | "ANY";

// Types for middleware handler components
export type Middleware = (session: Session, response: OutboundResponse) => any

/** Defines a route to a given endpoint */
export interface Routing {
    method: HTTPMethod; 
    host?: string;
    route: string;
    controller: WorkerController;
    propertyKey: string;
}

/** Defines a target durable object */
export interface DOTarget {
    name?: string;
    idstring?: string;
    id?: DurableObjectId;
}

/** Defines the shape of an object which defines a Response*/
export interface ResponseObject {
    status?: number,
    body?: any,
    headers?: Headers,
    websocket?: WebSocket
}

/** Defines the shape of a view check */
export type ViewCheck = (...vals: any[]) => ((val: any) => boolean)

// Types for storage API wrapper
export type GetOptions<T>  = T extends DurableObjectStorage ? DurableObjectGetOptions : KVNamespaceGetOptions<any>;
export type PutOptions<T>  = T extends DurableObjectStorage ? DurableObjectPutOptions : KVNamespacePutOptions;
export type ListOptions<T> = T extends DurableObjectStorage ? DurableObjectListOptions : KVNamespaceListOptions;