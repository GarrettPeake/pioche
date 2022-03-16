/**
 * List of all defined HTTP Verbs
 */
export enum Methods {
    ACL = "ACL",
    "BASELINE-CONTROL" = "BASELINE-CONTROL",
    BIND = "BIND",
    CHECKIN = "CHECKIN",
    CHECKOUT = "CHECKOUT",
    CONNECT = "CONNECT",
    COPY = "COPY",
    DELETE = "DELETE",
    GET = "GET",
    HEAD = "HEAD",
    LABEL = "LABEL",
    LINK = "LINK",
    LOCK = "LOCK",
    MERGE = "MERGE",
    MKACTIVITY = "MKACTIVITY",
    MKCALENDAR = "MKCALENDAR",
    MKCOL = "MKCOL",
    MKREDIRECTREF = "MKREDIRECTREF",
    MKWORKSPACE = "MKWORKSPACE",
    MOVE = "MOVE",
    OPTIONS = "OPTIONS",
    ORDERPATCH = "ORDERPATCH",
    PATCH = "PATCH",
    POST = "POST",
    PRI = "PRI",
    PROPFIND = "PROPFIND",
    PROPPATCH = "PROPPATCH",
    PUT = "PUT",
    REBIND = "REBIND",
    REPORT = "REPORT",
    SEARCH = "SEARCH",
    TRACE = "TRACE",
    UNBIND = "UNBIND",
    UNCHECKOUT = "UNCHECKOUT",
    UNLINK = "UNLINK",
    UNLOCK = "UNLOCK",
    UPDATE = "UPDATE",
    UPDATEREDIRECTREF = "UPDATEREDIRECTREF",
    "VERSION-CONTROL" = "VERSION-CONTROL",
}

// A type defining the strings that can be used as methods
export type HTTPMethod =
    "acl" | "ACL" |
    "baseline-control" | "BASELINE-CONTROL" |
    "bind" | "BIND" |
    "checkin" | "CHECKIN" |
    "checkout" | "CHECKOUT" |
    "connect" | "CONNECT" |
    "copy" | "COPY" |
    "delete" | "DELETE" |
    "get" | "GET" |
    "head" | "HEAD" |
    "label" | "LABEL" |
    "link" | "LINK" |
    "lock" | "LOCK" |
    "merge" | "MERGE" |
    "mkactivity" | "MKACTIVITY" |
    "mkcalendar" | "MKCALENDAR" |
    "mkcol" | "MKCOL" |
    "mkredirectref" | "MKREDIRECTREF" |
    "mkworkspace" | "MKWORKSPACE" |
    "move" | "MOVE" |
    "options" | "OPTIONS" |
    "orderpatch" | "ORDERPATCH" |
    "patch" | "PATCH" |
    "post" | "POST" |
    "pri" | "PRI" |
    "propfind" | "PROPFIND" |
    "proppatch" | "PROPPATCH" |
    "put" | "PUT" |
    "rebind" | "REBIND" |
    "report" | "REPORT" |
    "search" | "SEARCH" |
    "trace" | "TRACE" |
    "unbind" | "UNBIND" |
    "uncheckout" | "UNCHECKOUT" |
    "unlink" | "UNLINK" |
    "unlock" | "UNLOCK" |
    "update" | "UPDATE" |
    "updateredirectref" | "UPDATEREDIRECTREF" |
    "version-control" | "VERSION-CONTROL" ;

export function Route(method: HTTPMethod | Methods, route: string) { // Decorator Factory for put mappings
    return function (target: any, propertyKey: string) {
        target.constructor.routes.push(["GET", route, ]);
    };
}
  
export function BaseRoute(newBase: string) { // Decorator Factory for class base mappings
    return function (target: any) {
        target.baseMapping = newBase;
    };
}