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
export type middleware = (session: ClientSession, next: undefined | middleware | endware) => {}
export type endware =    (session: ClientSession, data: any, next: undefined | endware) => {}