import { WorkerController } from "../controllers/workercontroller";
import { Session } from "../io/input";

/** Type definition for objects with key level permissioned access */
export type PermissionedObject = {
    data: any;
    mask: any;
}

// A type defining the strings that can be used as methods
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

// Types for middleware and endware components
export type Middleware = (session: Session, next: undefined | Middleware | Endware) => {}
export type Endware =    (session: Session, data: any, next: undefined | Endware) => {}

export interface Routing {
    method: HTTPMethod; 
    host?: string;
    route: string;
    controller: WorkerController;
    propertyKey: string;
    DOBinding?: string;
}